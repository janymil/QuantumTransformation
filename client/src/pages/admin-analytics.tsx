import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Brain,
  MessageSquare,
  Star,
  Clock,
  Zap,
  Shield,
  Activity,
  Database,
  UserCheck,
  Target,
  Calendar,
  Award,
  Edit,
  Ban,
  Trash2,
  UserX,
  Eye,
  Settings,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [activeTab, setActiveTab] = useState("ai-usage");

  const correctPassword = "quantum2025admin";

  // Check for stored authentication on component mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("admin-auth-quantum");
    if (storedAuth === correctPassword) {
      setIsAuthenticated(true);
    }
  }, []);

  // Analytics query - only run if authenticated
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['/api/admin/analytics'],
    retry: false,
    enabled: isAuthenticated,
  });

  // User statistics query - only run if authenticated
  const { data: userStats, isLoading: userStatsLoading, error: userStatsError } = useQuery({
    queryKey: ['/api/admin/user-statistics'],
    retry: false,
    enabled: isAuthenticated,
  });

  // All users query for user management tab
  const { data: allUsers, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: isAuthenticated && activeTab === "user-management",
  });

  // State for user management
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "" });
  const [blockReason, setBlockReason] = useState("");

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthAttempted(true);
    
    if (password === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem("admin-auth-quantum", correctPassword);
      toast({
        title: "Access Granted",
        description: "Welcome to the admin analytics dashboard.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password. Please try again.",
        variant: "destructive",
      });
    }
    setPassword("");
  };

  // User management functions
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || ""
    });
    setEditDialogOpen(true);
  };

  const handleBlockUser = (user: any) => {
    setSelectedUser(user);
    setBlockReason("");
    setBlockDialogOpen(true);
  };

  const handleDeleteUser = (user: any) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const submitEditUser = async () => {
    try {
      await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      
      setEditDialogOpen(false);
      refetchUsers();
      toast({
        title: "User Updated",
        description: "User details have been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const submitBlockUser = async () => {
    try {
      await fetch(`/api/admin/users/${selectedUser.id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: blockReason })
      });
      
      setBlockDialogOpen(false);
      refetchUsers();
      toast({
        title: "User Blocked",
        description: "User access has been blocked.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to block user.",
        variant: "destructive",
      });
    }
  };

  const submitUnblockUser = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      refetchUsers();
      toast({
        title: "User Unblocked",
        description: "User access has been restored.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock user.",
        variant: "destructive",
      });
    }
  };

  const submitDeleteUser = async () => {
    try {
      await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE'
      });
      
      setDeleteDialogOpen(false);
      refetchUsers();
      toast({
        title: "User Deleted",
        description: "User and all associated data have been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="w-6 h-6" />
              Admin Access Required
            </CardTitle>
            <CardDescription>
              Enter the admin password to access sensitive analytics data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={authAttempted && password !== correctPassword ? "border-red-500" : ""}
                />
                {authAttempted && password !== correctPassword && (
                  <p className="text-red-500 text-sm mt-1">Incorrect password</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Access Dashboard
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Admin Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive platform monitoring and user management
              </p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <Alert className="flex-1 mr-4">
              <Shield className="w-4 h-4" />
              <AlertDescription>
                This dashboard contains sensitive analytics data. Access is restricted to authorized administrators only.
              </AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.removeItem("admin-auth-quantum");
                setIsAuthenticated(false);
                setPassword("");
                setAuthAttempted(false);
                toast({
                  title: "Logged Out",
                  description: "Admin session ended.",
                });
              }}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai-usage" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              AI Usage Analytics
            </TabsTrigger>
            <TabsTrigger value="user-stats" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              User Statistics & Metrics
            </TabsTrigger>
            <TabsTrigger value="user-management" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              User Management
            </TabsTrigger>
          </TabsList>

          {/* AI Usage Analytics Tab */}
          <TabsContent value="ai-usage" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load Analytics</h3>
                <p className="text-gray-600 dark:text-gray-400">Unable to fetch analytics data. Please check the server connection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Core Metrics */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Total Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Platform users</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      AI Responses
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics?.totalResponses || 0}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total generated</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Total Cost
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics?.totalCost || '0.00'}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">API costs</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Cache Savings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics?.costSavings || '0.00'}</div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Saved via cache</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* User Statistics Tab */}
          <TabsContent value="user-stats" className="space-y-6">
            {userStatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading user statistics...</p>
                </div>
              </div>
            ) : userStatsError ? (
              <div className="text-center py-8">
                <Database className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to Load User Statistics</h3>
                <p className="text-gray-600 dark:text-gray-400">Unable to fetch user data. Please check the server connection.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* User Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      User Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-semibold">{userStats?.userOverview?.totalUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Users:</span>
                      <span className="font-semibold">{userStats?.userOverview?.activeUsers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>New This Week:</span>
                      <span className="font-semibold">{userStats?.userOverview?.newUsersThisWeek || 0}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Challenge Participation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Challenge Engagement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {userStats?.challengeParticipation?.map((challenge: any) => (
                      <div key={challenge.challengeType} className="flex justify-between text-sm">
                        <span>{challenge.challengeType}:</span>
                        <span className="font-medium">{challenge.userCount} users</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Retention Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      User Retention
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>7-Day Retention:</span>
                      <span className="font-semibold">{userStats?.retentionMetrics?.sevenDayRetention || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>14-Day Retention:</span>
                      <span className="font-semibold">{userStats?.retentionMetrics?.fourteenDayRetention || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>21-Day Retention:</span>
                      <span className="font-semibold">{userStats?.retentionMetrics?.twentyOneDayRetention || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="user-management" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">User Management</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Manage user accounts, permissions, and activity
                  </p>
                </div>
                <Badge variant="outline" className="text-lg px-3 py-1">
                  {allUsers?.length || 0} Total Users
                </Badge>
              </div>

              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading users...</p>
                  </div>
                </div>
              ) : usersError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Failed to Load Users</h3>
                  <p className="text-gray-600 dark:text-gray-400">Unable to fetch user data. Please check the server connection.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                                {user.firstName?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'No Name'}
                                </div>
                                <div className="text-sm text-gray-500">ID: {user.id}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.isBlocked ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <UserX className="w-3 h-3" />
                                Blocked
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              <div>Challenges: {user.totalChallenges || 0}</div>
                              <div>AI Chats: {user.totalAIInteractions || 0}</div>
                              <div>Journals: {user.totalJournalEntries || 0}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                                className="flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" />
                                Edit
                              </Button>
                              
                              {user.isBlocked ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => submitUnblockUser(user.id)}
                                  className="flex items-center gap-1 text-green-600 hover:text-green-700"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  Unblock
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleBlockUser(user)}
                                  className="flex items-center gap-1 text-orange-600 hover:text-orange-700"
                                >
                                  <Ban className="w-3 h-3" />
                                  Block
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteUser(user)}
                                className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={submitEditUser}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Block User Dialog */}
        <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Block User Access</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Warning</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  This will prevent the user from accessing their account. They will be logged out immediately.
                </p>
              </div>
              
              <div>
                <Label htmlFor="blockReason">Reason for blocking</Label>
                <Textarea
                  id="blockReason"
                  placeholder="Enter the reason for blocking this user..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={submitBlockUser} disabled={!blockReason.trim()}>
                  Block User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Permanent Deletion</span>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This action cannot be undone. All user data including challenges, journals, affirmations, and AI interactions will be permanently deleted.
                </p>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete <strong>{selectedUser?.firstName} {selectedUser?.lastName}</strong> ({selectedUser?.email})?
              </p>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={submitDeleteUser}>
                  Permanently Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}