import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from 'fuse.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Users,
  Calendar,
  Clock,
  Target,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Plus,
  Minus,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  CreditCard,
  Calculator,
  FileText,
  Send,
  History,
  User,
  Building,
  Briefcase,
  Banknote,
  PiggyBank,
  Receipt,
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  role: string;
  baseSalary: number;
  hourlyRate?: number;
  payFrequency: 'monthly' | 'weekly' | 'bi-weekly';
  status: 'active' | 'inactive' | 'terminated';
  bankAccount: string;
  taxId: string;
  joinDate: string;
  lastPaymentDate?: string;
  nextDueDate: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  avatar?: string;
  allowances: {
    hra: number;
    transport: number;
    medical: number;
    other: number;
  };
  deductions: {
    tds: number;
    epf: number;
    esi: number;
    other: number;
  };
}

interface PaymentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  baseSalary: number;
  allowances: number;
  overtime: number;
  bonus: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  paymentDate: string;
  paymentMode: 'bank_transfer' | 'upi' | 'cash' | 'cheque';
  transactionId: string;
  status: 'paid' | 'pending' | 'failed';
  receiptUrl?: string;
}

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Doe',
    employeeId: 'EMP001',
    email: 'john.doe@company.com',
    department: 'Engineering',
    role: 'Senior Developer',
    baseSalary: 75000,
    payFrequency: 'monthly',
    status: 'active',
    bankAccount: 'HDFC****1234',
    taxId: 'TAX001234',
    joinDate: '2023-01-15',
    lastPaymentDate: '2025-08-31',
    nextDueDate: '2025-09-30',
    paymentStatus: 'pending',
    allowances: { hra: 15000, transport: 2000, medical: 1500, other: 1000 },
    deductions: { tds: 7500, epf: 1800, esi: 562, other: 500 },
  },
  {
    id: '2',
    name: 'Jane Smith',
    employeeId: 'EMP002',
    email: 'jane.smith@company.com',
    department: 'Marketing',
    role: 'Marketing Manager',
    baseSalary: 65000,
    payFrequency: 'monthly',
    status: 'active',
    bankAccount: 'ICICI****5678',
    taxId: 'TAX005678',
    joinDate: '2023-03-20',
    lastPaymentDate: '2025-08-31',
    nextDueDate: '2025-09-30',
    paymentStatus: 'paid',
    allowances: { hra: 13000, transport: 2000, medical: 1500, other: 800 },
    deductions: { tds: 6500, epf: 1560, esi: 487, other: 400 },
  },
  {
    id: '3',
    name: 'Bob Johnson',
    employeeId: 'EMP003',
    email: 'bob.johnson@company.com',
    department: 'Sales',
    role: 'Sales Representative',
    baseSalary: 50000,
    payFrequency: 'monthly',
    status: 'active',
    bankAccount: 'SBI****9012',
    taxId: 'TAX009012',
    joinDate: '2023-06-10',
    lastPaymentDate: '2025-07-31',
    nextDueDate: '2025-08-31',
    paymentStatus: 'overdue',
    allowances: { hra: 10000, transport: 2000, medical: 1500, other: 500 },
    deductions: { tds: 5000, epf: 1200, esi: 375, other: 300 },
  },
  {
    id: '4',
    name: 'Alice Wilson',
    employeeId: 'EMP004',
    email: 'alice.wilson@company.com',
    department: 'HR',
    role: 'HR Manager',
    baseSalary: 70000,
    payFrequency: 'monthly',
    status: 'active',
    bankAccount: 'AXIS****3456',
    taxId: 'TAX003456',
    joinDate: '2022-11-05',
    lastPaymentDate: '2025-08-31',
    nextDueDate: '2025-09-30',
    paymentStatus: 'paid',
    allowances: { hra: 14000, transport: 2000, medical: 1500, other: 1000 },
    deductions: { tds: 7000, epf: 1680, esi: 525, other: 450 },
  },
];

const mockPaymentHistory: PaymentRecord[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'John Doe',
    month: 'August',
    year: 2025,
    baseSalary: 75000,
    allowances: 19500,
    overtime: 5000,
    bonus: 10000,
    grossPay: 109500,
    deductions: 10362,
    netPay: 99138,
    paymentDate: '2025-08-31',
    paymentMode: 'bank_transfer',
    transactionId: 'TXN001234567',
    status: 'paid',
    receiptUrl: '/receipts/emp001-aug2025.pdf',
  },
  {
    id: '2',
    employeeId: 'EMP002',
    employeeName: 'Jane Smith',
    month: 'August',
    year: 2025,
    baseSalary: 65000,
    allowances: 17300,
    overtime: 0,
    bonus: 5000,
    grossPay: 87300,
    deductions: 8947,
    netPay: 78353,
    paymentDate: '2025-08-31',
    paymentMode: 'bank_transfer',
    transactionId: 'TXN001234568',
    status: 'paid',
  },
];

type ViewMode = 'table' | 'grid';
type SortField = 'name' | 'department' | 'baseSalary' | 'nextDueDate' | 'paymentStatus';
type SortOrder = 'asc' | 'desc';

const Payroll: React.FC = () => {
  const navigate = useNavigate();
  const [employees] = useState<Employee[]>(mockEmployees);
  const [paymentHistory] = useState<PaymentRecord[]>(mockPaymentHistory);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Fuse for fuzzy search
  const fuse = useMemo(() => new Fuse(employees, {
    keys: ['name', 'employeeId', 'department', 'role', 'email'],
    threshold: 0.3,
  }), [employees]);

  // Filter and search employees
  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    // Apply search
    if (searchTerm) {
      const fuseResults = fuse.search(searchTerm);
      filtered = fuseResults.map(result => result.item);
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => emp.paymentStatus === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'baseSalary') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (sortField === 'nextDueDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
        return sortOrder === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

    return filtered;
  }, [employees, searchTerm, departmentFilter, statusFilter, sortField, sortOrder, fuse]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    const totalEmployees = employees.length;
    const totalPayroll = employees.reduce((sum, emp) => {
      const grossPay = emp.baseSalary + Object.values(emp.allowances).reduce((a, b) => a + b, 0);
      return sum + grossPay;
    }, 0);
    const pendingPayments = employees.filter(emp => emp.paymentStatus === 'pending').length;
    const overduePayments = employees.filter(emp => emp.paymentStatus === 'overdue').length;
    const paidPayments = employees.filter(emp => emp.paymentStatus === 'paid').length;

    return {
      totalEmployees,
      totalPayroll,
      pendingPayments,
      overduePayments,
      paidPayments,
      upcomingPaymentDate: '2025-09-30',
    };
  }, [employees]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleBulkPay = () => {
    // Implement bulk payment logic
    console.log('Processing bulk payments...');
  };

  const handleExportCSV = () => {
    // Implement CSV export
    console.log('Exporting to CSV...');
  };

  const calculateNetPay = (employee: Employee) => {
    const grossPay = employee.baseSalary + Object.values(employee.allowances).reduce((a, b) => a + b, 0);
    const totalDeductions = Object.values(employee.deductions).reduce((a, b) => a + b, 0);
    return grossPay - totalDeductions;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage employee payments and payment history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="rounded-none"
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="rounded-none"
            disabled={filteredEmployees.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="rounded-none">
                <Calculator className="h-4 w-4 mr-2" />
                Process Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Process Monthly Payroll</DialogTitle>
                <DialogDescription>
                  Process payroll for all eligible employees
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Month</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="september-2025">September 2025</SelectItem>
                      <SelectItem value="october-2025">October 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Department</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleBulkPay}>
                  <Send className="h-4 w-4 mr-2" />
                  Process Payments
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active payroll</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalPayroll)}</div>
            <p className="text-xs text-muted-foreground">Total amount</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.paidPayments}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overduePayments}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>

        <Card className="rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">Sep 30</div>
            <p className="text-xs text-muted-foreground">Upcoming date</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-none">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-none"
          />
        </div>

        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48 rounded-none">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="HR">HR</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 rounded-none">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>

        <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(parseInt(value))}>
          <SelectTrigger className="w-32 rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 rows</SelectItem>
            <SelectItem value="25">25 rows</SelectItem>
            <SelectItem value="50">50 rows</SelectItem>
            <SelectItem value="100">100 rows</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList className="rounded-none">
          <TabsTrigger value="employees" className="rounded-none">Employee Records</TabsTrigger>
          <TabsTrigger value="history" className="rounded-none">Payment History</TabsTrigger>
          <TabsTrigger value="reports" className="rounded-none">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <div className="rounded-none border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="border-r border-border/50">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-semibold justify-start"
                    >
                      Employee
                      {sortField === 'name' && (
                        sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="border-r border-border/50 text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('department')}
                      className="h-auto p-0 font-semibold"
                    >
                      Department
                      {sortField === 'department' && (
                        sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="border-r border-border/50 text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('baseSalary')}
                      className="h-auto p-0 font-semibold"
                    >
                      Base Salary
                      {sortField === 'baseSalary' && (
                        sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="border-r border-border/50 text-center">Pay Frequency</TableHead>
                  <TableHead className="border-r border-border/50 text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('paymentStatus')}
                      className="h-auto p-0 font-semibold"
                    >
                      Status
                      {sortField === 'paymentStatus' && (
                        sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="border-r border-border/50 text-center">Last Payment</TableHead>
                  <TableHead className="border-r border-border/50 text-center">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('nextDueDate')}
                      className="h-auto p-0 font-semibold"
                    >
                      Next Due
                      {sortField === 'nextDueDate' && (
                        sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="border-r border-border/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={employee.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${employee.name}`} />
                          <AvatarFallback>
                            {employee.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.employeeId}</div>
                          <div className="text-sm text-muted-foreground">{employee.role}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50 text-center">
                      <Badge variant="outline" className="rounded-none">
                        {employee.department}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r border-border/50 text-center">
                      <div className="font-medium">{formatCurrency(employee.baseSalary)}</div>
                      <div className="text-sm text-muted-foreground">
                        Net: {formatCurrency(calculateNetPay(employee))}
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50 text-center">
                      <Badge variant="secondary" className="rounded-none">
                        {employee.payFrequency}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r border-border/50 text-center">
                      <Badge variant={getStatusColor(employee.paymentStatus)} className="rounded-none">
                        {employee.paymentStatus.charAt(0).toUpperCase() + employee.paymentStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="border-r border-border/50 text-center">
                      <div className="text-sm">
                        {employee.lastPaymentDate ? new Date(employee.lastPaymentDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="border-r border-border/50 text-center">
                      <div className="text-sm">
                        {new Date(employee.nextDueDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="rounded-none">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{employee.name} - Payroll Details</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">Basic Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Employee ID:</strong> {employee.employeeId}</p>
                                  <p><strong>Department:</strong> {employee.department}</p>
                                  <p><strong>Role:</strong> {employee.role}</p>
                                  <p><strong>Join Date:</strong> {new Date(employee.joinDate).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Payment Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Base Salary:</strong> {formatCurrency(employee.baseSalary)}</p>
                                  <p><strong>Bank Account:</strong> {employee.bankAccount}</p>
                                  <p><strong>Tax ID:</strong> {employee.taxId}</p>
                                  <p><strong>Pay Frequency:</strong> {employee.payFrequency}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Allowances</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>HRA:</strong> {formatCurrency(employee.allowances.hra)}</p>
                                  <p><strong>Transport:</strong> {formatCurrency(employee.allowances.transport)}</p>
                                  <p><strong>Medical:</strong> {formatCurrency(employee.allowances.medical)}</p>
                                  <p><strong>Other:</strong> {formatCurrency(employee.allowances.other)}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">Deductions</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>TDS:</strong> {formatCurrency(employee.deductions.tds)}</p>
                                  <p><strong>EPF:</strong> {formatCurrency(employee.deductions.epf)}</p>
                                  <p><strong>ESI:</strong> {formatCurrency(employee.deductions.esi)}</p>
                                  <p><strong>Other:</strong> {formatCurrency(employee.deductions.other)}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" className="rounded-none">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-none">
                          <Send className="h-3 w-3 mr-1" />
                          Pay
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2">
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEmployees.length)} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-none"
              >
                Previous
              </Button>
              <div className="text-sm">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-none"
              >
                Next
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="rounded-none">
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="border-r border-border/50">Employee</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Period</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Gross Pay</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Deductions</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Net Pay</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Payment Date</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Mode</TableHead>
                    <TableHead className="border-r border-border/50 text-center">Transaction ID</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPaymentHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="border-r border-border/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${record.employeeName}`} />
                            <AvatarFallback>
                              {record.employeeName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{record.employeeName}</div>
                            <div className="text-sm text-muted-foreground">{record.employeeId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        {record.month} {record.year}
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="font-medium">{formatCurrency(record.grossPay)}</div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        {formatCurrency(record.deductions)}
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <div className="font-medium text-green-600">{formatCurrency(record.netPay)}</div>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        {new Date(record.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center">
                        <Badge variant="outline" className="rounded-none">
                          {record.paymentMode.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r border-border/50 text-center font-mono text-sm">
                        {record.transactionId}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="outline" size="sm" className="rounded-none">
                            <Receipt className="h-3 w-3 mr-1" />
                            Receipt
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-none">
                            <Download className="h-3 w-3 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-none">
              <CardHeader>
                <CardTitle>Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Employees</span>
                    <span className="font-semibold">{stats.totalEmployees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Payroll</span>
                    <span className="font-semibold">{formatCurrency(stats.totalPayroll)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Paid This Month</span>
                    <span className="font-semibold text-green-600">{stats.paidPayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Payments</span>
                    <span className="font-semibold text-orange-600">{stats.pendingPayments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overdue Payments</span>
                    <span className="font-semibold text-red-600">{stats.overduePayments}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-none">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full rounded-none" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Monthly Report
                  </Button>
                  <Button className="w-full rounded-none" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Payslips
                  </Button>
                  <Button className="w-full rounded-none" variant="outline">
                    <Calculator className="h-4 w-4 mr-2" />
                    Tax Calculation
                  </Button>
                  <Button className="w-full rounded-none" variant="outline">
                    <Send className="h-4 w-4 mr-2" />
                    Send Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Payroll;