export default function BlockchainBanner() {
  return (
    <section className="mb-8 bg-gradient-to-r from-accent to-accent-dark text-white rounded-lg overflow-hidden">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-2/3 mb-6 md:mb-0">
            <h2 className="text-2xl font-bold font-heading">Blockchain-Verified Transactions</h2>
            <p className="mt-4 text-lg opacity-90">Our platform uses blockchain technology to ensure transparent, secure, and traceable transactions between all parties.</p>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verify product origin and authenticity
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Secure payment processing
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Tamper-proof transaction records
              </li>
              <li className="flex items-center">
                <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Complete supply chain transparency
              </li>
            </ul>
            <button className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-accent bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-accent focus:ring-white">
              Learn More
            </button>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <svg className="h-64 w-64 opacity-90" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 20L140 40V80L100 100L60 80V40L100 20Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2"/>
              <path d="M100 100L140 120V160L100 180L60 160V120L100 100Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2"/>
              <path d="M140 40L180 60V100L140 120V80V40Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2"/>
              <path d="M60 40L20 60V100L60 120V80V40Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2"/>
              <path d="M100 20L100 100" stroke="white" strokeWidth="2"/>
              <path d="M140 40L140 120" stroke="white" strokeWidth="2"/>
              <path d="M60 40L60 120" stroke="white" strokeWidth="2"/>
              <path d="M180 60L180 140" stroke="white" strokeWidth="2"/>
              <path d="M20 60L20 140" stroke="white" strokeWidth="2"/>
              <circle cx="100" cy="20" r="4" fill="white"/>
              <circle cx="100" cy="100" r="4" fill="white"/>
              <circle cx="100" cy="180" r="4" fill="white"/>
              <circle cx="60" cy="40" r="4" fill="white"/>
              <circle cx="60" cy="120" r="4" fill="white"/>
              <circle cx="140" cy="40" r="4" fill="white"/>
              <circle cx="140" cy="120" r="4" fill="white"/>
              <circle cx="20" cy="60" r="4" fill="white"/>
              <circle cx="20" cy="140" r="4" fill="white"/>
              <circle cx="180" cy="60" r="4" fill="white"/>
              <circle cx="180" cy="140" r="4" fill="white"/>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
