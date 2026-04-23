'use client';

import { useSearchParams } from 'next/navigation';
import CalculatorForm from '@/app/components/meeting/calculator/CalculatorForm';

export default function CalculatorPage() {
  const searchParams = useSearchParams();

  const initialData = {
    meetingId: searchParams.get('meetingId') || '',
    leadId: searchParams.get('leadId') || '',
    name: searchParams.get('name') || '',
    phone: searchParams.get('phone') || '',
    city: searchParams.get('city') || '',
    electricityBill: Number(searchParams.get('electricityBill') || 0),
  };

  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Solar Calculator</h1>
        <p className="text-sm text-gray-600">
          Enter project details and calculate total cost
        </p>
      </div>

      <CalculatorForm initialData={initialData} />
    </div>
  );
}