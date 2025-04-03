import { Button } from "@/components/ui/button";

export default function HeroBanner() {
  return (
    <section className="bg-gradient-to-r from-primary to-primary-dark rounded-lg mb-8">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-6 md:mb-0 pr-0 md:pr-8">
            <div className="text-3xl md:text-5xl font-bold text-white font-heading mb-2">AgriConnect</div>
            <h1 className="text-2xl md:text-3xl font-bold text-white font-heading">Fresh Harvest Direct to Your Door</h1>
            <p className="mt-4 text-xl text-white opacity-90">Connect directly with farmers and get the freshest produce with secure blockchain transactions.</p>
            <div className="mt-6">
              <Button 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-primary bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
              >
                Shop Now
              </Button>
              <Button 
                variant="outline" 
                className="ml-4 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-dark bg-opacity-60 hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white"
              >
                Learn About Blockchain
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              className="h-64 w-full object-cover rounded-lg shadow-lg" 
              src="https://images.unsplash.com/photo-1498579809087-ef1e558fd1da?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" 
              alt="Fresh vegetables" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
