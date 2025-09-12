import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, RefreshCw, FileX, Database, HardDrive } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface DocumentHealthReport {
  totalEmployees: number
  totalDocuments: number
  healthyDocuments: number
  brokenDocuments: number
  employeesWithBrokenDocs: Array<{
    employeeId: string
    fullName: string
    brokenDocs: Array<{
      type: string
      path: string
      issue: string
    }>
  }>
}

export function DocumentHealthCheck() {
  const [report, setReport] = useState<DocumentHealthReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const runHealthCheck = async () => {
    setIsRunning(true)
    toast.info('Running document health check...')
    
    try {
      console.log('🔍 Starting document health check...')
      
      // Get all employees with documents
      const { data: employees, error: queryError } = await supabase
        .from('employees_details')
        .select('employee_id, full_name, documents')
        .not('documents', 'is', null)
        .not('employee_id', 'is', null)

      if (queryError) {
        throw new Error(`Database query failed: ${queryError.message}`)
      }

      if (!employees || employees.length === 0) {
        setReport({
          totalEmployees: 0,
          totalDocuments: 0,
          healthyDocuments: 0,
          brokenDocuments: 0,
          employeesWithBrokenDocs: []
        })
        setLastCheck(new Date())
        toast.success('No employees with documents found')
        return
      }

      console.log(`📊 Checking ${employees.length} employees...`)
      
      let totalDocs = 0
      let healthyDocs = 0
      let brokenDocs = 0
      const employeesWithIssues: DocumentHealthReport['employeesWithBrokenDocs'] = []

      // Check each employee's documents
      for (const employee of employees) {
        if (!employee.documents || !Array.isArray(employee.documents)) continue

        const brokenDocsForEmployee: Array<{type: string, path: string, issue: string}> = []
        
        for (const doc of employee.documents) {
          totalDocs++
          
          if (!doc.path) {
            brokenDocs++
            brokenDocsForEmployee.push({
              type: doc.type || 'Unknown',
              path: doc.path || 'No path',
              issue: 'Missing file path in database'
            })
            continue
          }

          // Test if file exists by trying to create signed URL
          try {
            const { data, error } = await supabase.storage
              .from('employee-documents')
              .createSignedUrl(doc.path, 60) // Short expiry for testing

            if (error) {
              brokenDocs++
              brokenDocsForEmployee.push({
                type: doc.type || 'Unknown',
                path: doc.path,
                issue: error.message
              })
            } else if (data?.signedUrl) {
              healthyDocs++
            } else {
              brokenDocs++
              brokenDocsForEmployee.push({
                type: doc.type || 'Unknown',
                path: doc.path,
                issue: 'No signed URL returned'
              })
            }
          } catch (err) {
            brokenDocs++
            brokenDocsForEmployee.push({
              type: doc.type || 'Unknown',
              path: doc.path,
              issue: err instanceof Error ? err.message : 'Unknown error'
            })
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        if (brokenDocsForEmployee.length > 0) {
          employeesWithIssues.push({
            employeeId: employee.employee_id,
            fullName: employee.full_name,
            brokenDocs: brokenDocsForEmployee
          })
        }
      }

      const healthReport: DocumentHealthReport = {
        totalEmployees: employees.length,
        totalDocuments: totalDocs,
        healthyDocuments: healthyDocs,
        brokenDocuments: brokenDocs,
        employeesWithBrokenDocs: employeesWithIssues
      }

      setReport(healthReport)
      setLastCheck(new Date())
      
      console.log('📋 Health check complete:', healthReport)
      
      if (brokenDocs === 0) {
        toast.success('All documents are healthy!')
      } else {
        toast.warning(`Found ${brokenDocs} broken documents across ${employeesWithIssues.length} employees`)
      }

    } catch (error) {
      console.error('❌ Health check failed:', error)
      toast.error(error instanceof Error ? error.message : 'Health check failed')
    } finally {
      setIsRunning(false)
    }
  }

  const getHealthScore = () => {
    if (!report || report.totalDocuments === 0) return 0
    return Math.round((report.healthyDocuments / report.totalDocuments) * 100)
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Document Storage Health Check
          </CardTitle>
          <Button
            onClick={runHealthCheck}
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Checking...' : 'Run Check'}
          </Button>
        </div>
        {lastCheck && (
          <p className="text-sm text-muted-foreground">
            Last check: {lastCheck.toLocaleString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {report ? (
          <>
            {/* Health Score */}
            <div className={`p-4 rounded-lg border ${getHealthColor(getHealthScore())}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Storage Health Score</h3>
                  <p className="text-sm opacity-80">
                    {report.healthyDocuments} of {report.totalDocuments} documents accessible
                  </p>
                </div>
                <div className="text-2xl font-bold">
                  {getHealthScore()}%
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{report.totalEmployees}</div>
                <div className="text-sm text-blue-700">Employees</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{report.totalDocuments}</div>
                <div className="text-sm text-gray-700">Total Documents</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{report.healthyDocuments}</div>
                <div className="text-sm text-green-700">Healthy</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{report.brokenDocuments}</div>
                <div className="text-sm text-red-700">Broken</div>
              </div>
            </div>

            {/* Issues List */}
            {report.employeesWithBrokenDocs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileX className="h-4 w-4 text-red-500" />
                  Employees with Broken Documents ({report.employeesWithBrokenDocs.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {report.employeesWithBrokenDocs.map((employee, index) => (
                    <div key={index} className="border rounded-lg p-3 bg-red-50 border-red-200">
                      <h4 className="font-medium text-red-900 mb-2">
                        {employee.fullName} ({employee.employeeId})
                      </h4>
                      <div className="space-y-2">
                        {employee.brokenDocs.map((doc, docIndex) => (
                          <div key={docIndex} className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {doc.type}
                              </Badge>
                              <code className="text-xs bg-red-100 px-1 rounded">
                                {doc.path.length > 60 ? '...' + doc.path.slice(-60) : doc.path}
                              </code>
                            </div>
                            <p className="text-xs text-red-700 pl-2">
                              <AlertCircle className="h-3 w-3 inline mr-1" />
                              {doc.issue}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.brokenDocuments === 0 && (
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <h3 className="font-semibold text-green-900">All Documents Healthy!</h3>
                <p className="text-sm text-green-700">
                  All document files are accessible in storage.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Run Check" to analyze document storage health</p>
            <p className="text-sm mt-2">
              This will verify that all employee documents exist in storage and are accessible.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}