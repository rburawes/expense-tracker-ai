import type { Metadata } from 'next';
import { ExportHubView } from '@/components/cloud/ExportHubView';

export const metadata: Metadata = { title: 'Export & Sync' };

export default function ExportPage() {
  return <ExportHubView />;
}
