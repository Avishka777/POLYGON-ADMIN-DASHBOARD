'use client';

import React from 'react';
import { DbExporterWorkspace } from '@/components/db-exporter/DbExporterWorkspace';

export default function DeveloperDbExporterPage() {
  return <DbExporterWorkspace role="developer" backUrl="/developer" />;
}
