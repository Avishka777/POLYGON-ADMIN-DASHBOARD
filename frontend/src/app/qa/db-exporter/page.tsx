'use client';

import React from 'react';
import { DbExporterWorkspace } from '@/components/db-exporter/DbExporterWorkspace';

export default function QaDbExporterPage() {
  return <DbExporterWorkspace role="qa" backUrl="/qa" />;
}
