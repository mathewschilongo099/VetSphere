import Link from 'next/link';

export default function MedicalDisclaimer() {
  return (
    <aside
      role="note"
      className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 sm:text-sm"
    >
      <strong>Educational information only.</strong> This article is general information for
      farmers, students and pet owners. It is not a diagnosis and does not replace advice from a
      qualified veterinarian. If an animal is seriously ill, contact a veterinarian or your local
      veterinary authority straight away. Read our{' '}
      <Link href="/disclaimer" className="underline">
        full disclaimer
      </Link>
      .
    </aside>
  );
}
