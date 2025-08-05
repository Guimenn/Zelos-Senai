'use client'
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/pages/auth/login');
      return;
    }
    try {
      const decoded: any = jwtDecode(token);
      if (decoded.role.toLowerCase() !== 'admin') {
        router.push('/pages/auth/login');
      }
      setUser(decoded);
    } catch (error) {
      console.error('Invalid token', error);
      router.push('/pages/auth/login');
    }
  }, [router]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p>Welcome, {user.email}!</p>
      {/* Add admin-specific content here */}
    </div>
  );
}