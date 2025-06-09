import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, User, Stethoscope } from 'lucide-react'

export default function AuthModal({ isOpen, onClose }) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()

  const [loginData, setLoginData] = useState({
    username: '',
    password: ''
  })

  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    user_type: 'patient',
    first_name: '',
    last_name: '',
    phone: '',
    country: '',
    license_number: '',
    specialization: '',
    clinic_name: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(loginData.username, loginData.password)
    
    if (result.success) {
      onClose()
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await register(registerData)
    
    if (result.success) {
      onClose()
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-cyan-600">Welcome to OdontoTravel</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="register">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={loginData.username}
                    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="text-red-600 text-sm font-medium mb-1">Sign In Error</div>
                    <div className="text-red-500 text-sm">{error}</div>
                    {error.includes('Browser extension conflict') && (
                      <div className="mt-2 text-xs text-red-400">
                        <strong>Quick fixes:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>Try using incognito/private browsing mode</li>
                          <li>Temporarily disable browser extensions</li>
                          <li>Refresh the page and try again</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_type">I am a...</Label>
                  <Select 
                    value={registerData.user_type} 
                    onValueChange={(value) => setRegisterData({...registerData, user_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          Patient
                        </div>
                      </SelectItem>
                      <SelectItem value="dentist">
                        <div className="flex items-center">
                          <Stethoscope className="w-4 h-4 mr-2" />
                          Dentist
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      type="text"
                      value={registerData.first_name}
                      onChange={(e) => setRegisterData({...registerData, first_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      type="text"
                      value={registerData.last_name}
                      onChange={(e) => setRegisterData({...registerData, last_name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg_username">Username</Label>
                  <Input
                    id="reg_username"
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg_password">Password</Label>
                  <Input
                    id="reg_password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      type="text"
                      value={registerData.country}
                      onChange={(e) => setRegisterData({...registerData, country: e.target.value})}
                    />
                  </div>
                </div>

                {registerData.user_type === 'dentist' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="license_number">License Number</Label>
                      <Input
                        id="license_number"
                        type="text"
                        value={registerData.license_number}
                        onChange={(e) => setRegisterData({...registerData, license_number: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        type="text"
                        value={registerData.specialization}
                        onChange={(e) => setRegisterData({...registerData, specialization: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinic_name">Clinic Name</Label>
                      <Input
                        id="clinic_name"
                        type="text"
                        value={registerData.clinic_name}
                        onChange={(e) => setRegisterData({...registerData, clinic_name: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="text-red-600 text-sm font-medium mb-1">Registration Error</div>
                    <div className="text-red-500 text-sm">{error}</div>
                    {error.includes('Browser extension conflict') && (
                      <div className="mt-2 text-xs text-red-400">
                        <strong>Quick fixes:</strong>
                        <ul className="list-disc list-inside mt-1">
                          <li>Try using incognito/private browsing mode</li>
                          <li>Temporarily disable browser extensions</li>
                          <li>Refresh the page and try again</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

