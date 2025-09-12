import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Search, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  Database,
  Folder,
  User
} from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

interface DocumentAnalysis {
  totalEmployees: number
  totalDocuments: number
  accessibleDocuments: number
  brokenDocuments: number
  pathPatterns: string[]
  recentUploads: Array<{
    employeeName: string
    documentType: string
    uploadDate: string
    path: string
  }>
  employeeDetails: Array<{
    id: string
    employeeId: string | null
    fullName: string
    email: string
    status: string
    documents: Array<{
      type: string
      path: string
      filename: string
      size: number
      uploadedAt: string
      accessible: boolean
      error?: string
    }>
  }>
}

export function DocumentPathAnalyzer() {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [showRawData, setShowRawData] = useState(false)

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    toast.info('Analyzing document paths...')

    try {
      console.log('🔍 Starting document path analysis...')

      // Fetch all employees with documents
      const { data: employees, error: queryError } = await supabase
        .from('employees_details')
        .select(`
          id,
          employee_id,
          full_name,
          personal_email,
          status,
          documents,
          created_at,
          updated_at
        `)
        .not('documents', 'is', null)
        .order('created_at', { ascending: false })

      if (queryError) {
        throw new Error(`Database query failed: ${queryError.message}`)
      }

      if (!employees || employees.length === 0) {
        setAnalysis({
          totalEmployees: 0,
          totalDocuments: 0,
          accessibleDocuments: 0,
          brokenDocuments: 0,
          pathPatterns: [],
          recentUploads: [],
          employeeDetails: []
        })
        toast.success('No employees with documents found')
        return
      }

      console.log(`📊 Analyzing ${employees.length} employees...`)

      let totalDocs = 0
      let accessibleDocs = 0
      let brokenDocs = 0
      const pathPatterns = new Set<string>()
      const recentUploads: DocumentAnalysis['recentUploads'] = []
      const employeeDetails: DocumentAnalysis['employeeDetails'] = []
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      // Analyze each employee (limit to first 20 for performance)
      const employeesToAnalyze = employees.slice(0, 20)

      for (const employee of employeesToAnalyze) {
        if (!employee.documents || !Array.isArray(employee.documents)) {
          continue
        }

        const employeeDetail: DocumentAnalysis['employeeDetails'][0] = {
          id: employee.id,
          employeeId: employee.employee_id,
          fullName: employee.full_name,
          email: employee.personal_email,
          status: employee.status,
          documents: []
        }

        for (const doc of employee.documents) {
          totalDocs++

          // Extract path pattern
          if (doc.path) {
            const pattern = doc.path
              .replace(/[a-f0-9-]{36}/g, '[UUID]')
              .replace(/[a-f0-9-]{12,}/g, '[ID]')
              .replace(/\d{10,}/g, '[TIMESTAMP]')
              .replace(/\.(jpg|jpeg|png|pdf|doc|docx)$/i, '.[EXT]')
            pathPatterns.add(pattern)
          }

          // Check if recent upload
          if (doc.uploaded_at && new Date(doc.uploaded_at) > oneWeekAgo) {
            recentUploads.push({
              employeeName: employee.full_name,
              documentType: doc.type || 'Unknown',
              uploadDate: doc.uploaded_at,
              path: doc.path || 'No path'
            })
          }

          // Test accessibility
          let accessible = false
          let error = ''

          if (doc.path) {
            try {
              const { data: signedData, error: signedError } = await supabase.storage
                .from('employee-documents')
                .createSignedUrl(doc.path, 60)

              if (signedError) {
                error = signedError.message
                brokenDocs++
              } else if (signedData?.signedUrl) {
                accessible = true
                accessibleDocs++
              } else {
                error = 'No signed URL returned'
                brokenDocs++
              }
            } catch (err) {
              error = err instanceof Error ? err.message : 'Unknown error'
              brokenDocs++
            }
          } else {
            error = 'No file path'
            brokenDocs++
          }

          employeeDetail.documents.push({
            type: doc.type || 'Unknown',
            path: doc.path || 'No path',
            filename: doc.filename || 'No filename',
            size: doc.size || 0,
            uploadedAt: doc.uploaded_at || '',
            accessible,
            error: accessible ? undefined : error
          })

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50))
        }

        employeeDetails.push(employeeDetail)
      }

      const analysisResult: DocumentAnalysis = {
        totalEmployees: employees.length,
        totalDocuments: totalDocs,
        accessibleDocuments: accessibleDocs,
        brokenDocuments: brokenDocs,
        pathPatterns: Array.from(pathPatterns),
        recentUploads,
        employeeDetails
      }

      setAnalysis(analysisResult)
      console.log('📋 Analysis complete:', analysisResult)

      if (brokenDocs === 0) {
        toast.success('All analyzed documents are accessible!')
      } else {
        toast.warning(`Found ${brokenDocs} broken documents out of ${totalDocs}`)
      }

    } catch (error) {
      console.error('❌ Analysis failed:', error)
      toast.error(error instanceof Error ? error.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const exportAnalysis = () => {
    if (!analysis) return

    const exportData = {
      summary: {
        totalEmployees: analysis.totalEmployees,
        totalDocuments: analysis.totalDocuments,
        accessibleDocuments: analysis.accessibleDocuments,
        brokenDocuments: analysis.brokenDocuments,
        successRate: analysis.totalDocuments > 0 ? 
          ((analysis.accessibleDocuments / analysis.totalDocuments) * 100).toFixed(1) + '%' : '0%'
      },
      pathPatterns: analysis.pathPatterns,
      recentUploads: analysis.recentUploads,
      employeeDetails: analysis.employeeDetails
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `document-analysis-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Analysis exported successfully')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Document Path Analysis
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={runAnalysis}
                disabled={isAnalyzing}
                variant="outline"
                size="sm"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Analyze Paths
                  </>
                )}
              </Button>
              {analysis && (
                <Button
                  onClick={exportAnalysis}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyze document paths for all employees to identify broken files and path patterns
          </p>
        </CardHeader>

        {analysis && (
          <CardContent className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">{analysis.totalEmployees}</div>
                <div className="text-sm text-blue-700">Employees</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-600">{analysis.totalDocuments}</div>
                <div className="text-sm text-gray-700">Total Documents</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">{analysis.accessibleDocuments}</div>
                <div className="text-sm text-green-700">Accessible</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">{analysis.brokenDocuments}</div>
                <div className="text-sm text-red-700">Broken</div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Success Rate</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: analysis.totalDocuments > 0 
                        ? `${(analysis.accessibleDocuments / analysis.totalDocuments) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {analysis.totalDocuments > 0 
                    ? `${((analysis.accessibleDocuments / analysis.totalDocuments) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>

            {/* Path Patterns */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Path Patterns Found
              </h3>
              <div className="space-y-1">
                {analysis.pathPatterns.map((pattern, index) => (
                  <code key={index} className="block text-xs bg-gray-100 p-2 rounded">
                    {pattern}
                  </code>
                ))}
              </div>
            </div>

            {/* Recent Uploads */}
            {analysis.recentUploads.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Uploads (Last 7 Days)
                </h3>
                <div className="space-y-2">
                  {analysis.recentUploads.map((upload, index) => (
                    <div key={index} className="flex items-center justify-between text-sm bg-blue-50 p-2 rounded">
                      <span>{upload.employeeName}</span>
                      <Badge variant="outline">{upload.documentType}</Badge>
                      <span className="text-muted-foreground">
                        {new Date(upload.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Employee Details */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Employee Details (First 20 Analyzed)
              </h3>
              <div className="space-y-3">
                {analysis.employeeDetails.map((employee) => (
                  <Card key={employee.id} className="p-3">
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setSelectedEmployee(
                        selectedEmployee === employee.id ? null : employee.id
                      )}
                    >
                      <div>
                        <h4 className="font-medium">{employee.fullName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {employee.employeeId || 'No ID'} • {employee.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={employee.status === 'approved' ? 'default' : 'secondary'}>
                          {employee.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {employee.documents.length} docs
                        </span>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            {employee.documents.filter(d => d.accessible).length}
                          </span>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm">
                            {employee.documents.filter(d => !d.accessible).length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedEmployee === employee.id && (
                      <div className="mt-3 space-y-2">
                        {employee.documents.map((doc, docIndex) => (
                          <div key={docIndex} className="text-sm border rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline">{doc.type}</Badge>
                              {doc.accessible ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Path: <code>{doc.path}</code>
                            </p>
                            <p className="text-xs text-muted-foreground mb-1">
                              File: {doc.filename} ({(doc.size / 1024).toFixed(1)}KB)
                            </p>
                            {doc.uploadedAt && (
                              <p className="text-xs text-muted-foreground mb-1">
                                Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                              </p>
                            )}
                            {!doc.accessible && doc.error && (
                              <p className="text-xs text-red-600">
                                Error: {doc.error}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>

            {/* Raw Data Toggle */}
            <div className="border-t pt-4">
              <Button
                onClick={() => setShowRawData(!showRawData)}
                variant="ghost"
                size="sm"
              >
                <Database className="h-4 w-4 mr-2" />
                {showRawData ? 'Hide' : 'Show'} Raw Data
              </Button>
              
              {showRawData && (
                <Textarea
                  value={JSON.stringify(analysis, null, 2)}
                  readOnly
                  className="mt-2 h-64 font-mono text-xs"
                />
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}