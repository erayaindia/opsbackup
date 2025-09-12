import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  MapPin,
  Clock,
  CalendarDays,
  Star,
  Gift,
  Sun,
  Palmtree,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Mock holiday data
const mockHolidays = [
  {
    id: 1,
    name: "New Year's Day",
    date: "2024-01-01",
    type: "national",
    isOfficial: true,
    location: "All Offices",
    description: "Start of the new year",
    addedBy: "HR Team",
    addedDate: "2023-12-01"
  },
  {
    id: 2,
    name: "Republic Day",
    date: "2024-01-26",
    type: "national",
    isOfficial: true,
    location: "India Offices",
    description: "Indian national holiday",
    addedBy: "HR Team",
    addedDate: "2023-12-01"
  },
  {
    id: 3,
    name: "Holi",
    date: "2024-03-25",
    type: "religious",
    isOfficial: true,
    location: "India Offices",
    description: "Festival of colors",
    addedBy: "HR Team",
    addedDate: "2023-12-15"
  },
  {
    id: 4,
    name: "Good Friday",
    date: "2024-03-29",
    type: "religious",
    isOfficial: true,
    location: "All Offices",
    description: "Christian holiday",
    addedBy: "HR Team",
    addedDate: "2023-12-01"
  },
  {
    id: 5,
    name: "Independence Day",
    date: "2024-08-15",
    type: "national",
    isOfficial: true,
    location: "India Offices",
    description: "Indian independence day",
    addedBy: "HR Team",
    addedDate: "2023-12-01"
  },
  {
    id: 6,
    name: "Company Foundation Day",
    date: "2024-09-15",
    type: "company",
    isOfficial: false,
    location: "All Offices",
    description: "Celebrating company anniversary",
    addedBy: "Management",
    addedDate: "2023-11-20"
  },
  {
    id: 7,
    name: "Diwali",
    date: "2024-11-01",
    type: "religious",
    isOfficial: true,
    location: "India Offices",
    description: "Festival of lights",
    addedBy: "HR Team",
    addedDate: "2023-12-01"
  },
  {
    id: 8,
    name: "Christmas Day",
    date: "2024-12-25",
    type: "religious",
    isOfficial: true,
    location: "All Offices",
    description: "Christian holiday",
    addedBy: "HR Team",
    addedDate: "2023-12-01"
  }
]

export default function Holidays() {
  const [holidays, setHolidays] = useState(mockHolidays)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedHoliday, setSelectedHoliday] = useState(null)
  const [newHoliday, setNewHoliday] = useState({
    name: '',
    date: '',
    type: 'company',
    isOfficial: false,
    location: 'All Offices',
    description: ''
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'national':
        return <Star className="h-4 w-4 text-blue-500" />
      case 'religious':
        return <Sun className="h-4 w-4 text-orange-500" />
      case 'company':
        return <Gift className="h-4 w-4 text-purple-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      national: 'bg-blue-100 text-blue-800 border-blue-200',
      religious: 'bg-orange-100 text-orange-800 border-orange-200',
      company: 'bg-purple-100 text-purple-800 border-purple-200',
    }
    
    return (
      <Badge variant="outline" className={variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         holiday.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'ALL' || holiday.type === selectedType
    
    return matchesSearch && matchesType
  })

  const upcomingHolidays = holidays
    .filter(holiday => new Date(holiday.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  const handleAddHoliday = () => {
    const id = Math.max(...holidays.map(h => h.id)) + 1
    const holiday = {
      ...newHoliday,
      id,
      addedBy: 'Current User',
      addedDate: new Date().toISOString().split('T')[0]
    }
    setHolidays([...holidays, holiday])
    setNewHoliday({
      name: '',
      date: '',
      type: 'company',
      isOfficial: false,
      location: 'All Offices',
      description: ''
    })
    setIsAddDialogOpen(false)
  }

  const handleDeleteHoliday = () => {
    if (selectedHoliday) {
      setHolidays(holidays.filter(h => h.id !== selectedHoliday.id))
      setIsDeleteDialogOpen(false)
      setSelectedHoliday(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full" />
              <h1 className="text-2xl font-bold tracking-tight">Holidays</h1>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Holiday
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground ml-6">Manage company holidays and important dates</p>
        </div>

        {/* Quick Stats & Upcoming Holidays */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <CalendarDays className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {holidays.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Star className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {holidays.filter(h => h.type === 'national').length}
                      </div>
                      <div className="text-xs text-muted-foreground">National</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Sun className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">
                        {holidays.filter(h => h.type === 'religious').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Religious</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Gift className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {holidays.filter(h => h.type === 'company').length}
                      </div>
                      <div className="text-xs text-muted-foreground">Company</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Upcoming Holidays */}
          <Card className="border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Palmtree className="h-4 w-4 text-emerald-600" />
                </div>
                Upcoming Holidays
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {upcomingHolidays.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming holidays
                  </p>
                ) : (
                  upcomingHolidays.map((holiday) => (
                    <div key={holiday.id} className="p-3 rounded-lg bg-muted/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(holiday.type)}
                          <span className="font-medium text-sm">{holiday.name}</span>
                        </div>
                        {holiday.isOfficial && (
                          <Badge variant="secondary" className="text-xs">Official</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(holiday.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <Filter className="h-4 w-4 text-violet-600" />
              </div>
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search holidays..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Holiday Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="religious">Religious</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Holidays Table */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-amber-600" />
                </div>
                Holiday Calendar
                <Badge variant="secondary" className="ml-2">
                  {filteredHolidays.length} holidays
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Holiday</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Location</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHolidays.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Calendar className="h-8 w-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No holidays found matching your criteria</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHolidays
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((holiday) => (
                        <TableRow key={holiday.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {getTypeIcon(holiday.type)}
                              <div>
                                <div className="font-medium text-sm">{holiday.name}</div>
                                <div className="text-xs text-muted-foreground truncate max-w-xs">
                                  {holiday.description}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              {new Date(holiday.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(holiday.type)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {holiday.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            {holiday.isOfficial ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Official
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Optional
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedHoliday(holiday)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedHoliday(holiday)
                                  setIsDeleteDialogOpen(true)
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Add Holiday Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Holiday</DialogTitle>
              <DialogDescription>
                Add a new holiday to the company calendar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Holiday Name</Label>
                <Input
                  id="name"
                  placeholder="Enter holiday name"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newHoliday.type} onValueChange={(value) => setNewHoliday({...newHoliday, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="national">National</SelectItem>
                    <SelectItem value="religious">Religious</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., All Offices, India Offices"
                  value={newHoliday.location}
                  onChange={(e) => setNewHoliday({...newHoliday, location: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the holiday"
                  value={newHoliday.description}
                  onChange={(e) => setNewHoliday({...newHoliday, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddHoliday}>
                Add Holiday
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Holiday Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedHoliday?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteHoliday} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}