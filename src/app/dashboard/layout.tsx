'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCoupleProfile } from '@/lib/db';
import { motion } from 'framer-motion';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function verify() {
      const data = await getCoupleProfile();
      if (!data) {
        router.push('/');
      } else {
        setAuthorized(true);
      }
    }
    verify();
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex-1 flex justify-center items-center bg-[#07030c] min-h-screen">
        <div className="w-6 h-6 rounded-full border-2 border-sensual-pink border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
}
