export default function PartnershipSection() {
  return (
    <section className="mb-8">
      <div className="bg-white rounded-lg shadow-card overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 font-heading mb-4">Government-Supported Initiative</h2>
          <p className="text-gray-600">AgriMarket works in partnership with government agricultural agencies to ensure fair trade practices, quality standards, and sustainable farming support.</p>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path>
                <line x1="4" y1="22" x2="4" y2="15"></line>
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900 text-center">Quality Standards</p>
            </div>
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"></path>
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900 text-center">Farmer Support</p>
            </div>
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900 text-center">Market Insights</p>
            </div>
            <div className="flex flex-col items-center">
              <svg className="h-12 w-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <p className="mt-2 text-sm font-medium text-gray-900 text-center">Security Measures</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
