'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from 'next/image';

import LoginImage from '../../public/login.jpg';
import Logo from '../../public/logo.png';
import { Checkbox } from '@/components/ui/checkbox';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Successfully logged in, redirect to home
                router.push('/');
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left side - Image */}
            <div className="hidden lg:flex lg:w-1/2 bg-gray-100 items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20" />
                <Image
                    src={LoginImage}
                    width={0}
                    height={0}
                    alt="Login visual"
                    className="object-cover w-full h-full"
                />
            </div>

            {/* Right side - Login form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-white">
                <div className="w-full max-w-md space-y-6 sm:space-y-8">
                    {/* Logo */}
                    <div className="flex flex-col items-center space-y-3 sm:space-y-4">
                        <div className="w-full h-full pb-2 sm:pb-4 rounded-xl flex items-center justify-center">
                            <Image 
                                src={Logo} 
                                width={175} 
                                height={0} 
                                alt="Logo" 
                                className="w-32 sm:w-40 lg:w-[175px] h-auto"
                            />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome back</h2>
                        <p className="text-sm sm:text-base text-gray-500 text-center px-2">Please enter your details to sign in</p>
                    </div>

                    <Card className="border-none shadow-none">
                        <CardContent className="space-y-4 sm:space-y-6 pt-6">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription className="text-sm">{error}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <Input
                                        type="text"
                                        placeholder="Email or username"
                                        value={formData.username}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                username: e.target.value,
                                            }))
                                        }
                                        className="h-11 text-sm sm:text-base"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Input
                                        type="password"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                password: e.target.value,
                                            }))
                                        }
                                        className="h-11 text-sm sm:text-base"
                                        required
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <Checkbox />
                                        <span className="text-xs sm:text-sm text-gray-600">Remember me</span>
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-11 text-sm sm:text-base"
                                    disabled={loading}
                                >
                                    {loading ? 'Signing in...' : 'Sign in'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}