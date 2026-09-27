'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RoleSelectScreen } from '@/components/common/RoleSelectScreen';
import { useTheme } from '@/context/ThemeContext';

export default function SelectRolePage() {
  const router = useRouter();
  const { isLightTheme, toggleTheme } = useTheme();

  const handleSelectRole = (role: 'qa' | 'developer') => {
    try {
      localStorage.setItem('app_manager_user_role', role);
    } catch {
      // Ignore
    }

    if (role === 'developer') {
      router.push('/developer');
    } else {
      router.push('/qa');
    }
  };

  return (
    <RoleSelectScreen
      onSelectRole={handleSelectRole}
      isLightTheme={isLightTheme}
      onToggleTheme={toggleTheme}
    />
  );
}
