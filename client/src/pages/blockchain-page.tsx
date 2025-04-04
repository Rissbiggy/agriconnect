import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import BlockchainTransactionsList from "@/components/BlockchainTransactionsList";
import BlockchainBanner from "@/components/BlockchainBanner";
import CartDrawer from "@/components/CartDrawer";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function BlockchainPage() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header onCartClick={() => setIsCartOpen(true)} />
      
      <main className="flex-1 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-2">Blockchain Transactions</h1>
            <p className="text-gray-600">Securely view and manage your blockchain transactions</p>
          </div>
          
          {/* Banner explaining blockchain technology */}
          <div className="mb-8">
            <BlockchainBanner />
          </div>
          
          {/* The actual transactions list */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <BlockchainTransactionsList />
          </div>
          
          {/* Educational section about blockchain */}
          <div className="mt-10 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Understanding Blockchain Technology</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold text-lg mb-2">Security</h3>
                <p className="text-gray-600">Blockchain technology uses advanced cryptography to secure transactions, making them nearly impossible to tamper with.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold text-lg mb-2">Transparency</h3>
                <p className="text-gray-600">All transactions are recorded on a public ledger that anyone can verify, ensuring complete transparency.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold text-lg mb-2">Efficiency</h3>
                <p className="text-gray-600">Direct transactions between parties eliminate intermediaries, reducing costs and increasing speed.</p>
              </div>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold text-lg">What is a blockchain transaction?</h3>
                <p className="text-gray-600 mt-2">A blockchain transaction is a secure record of exchange between parties, permanently recorded on a distributed ledger.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold text-lg">How are transactions verified?</h3>
                <p className="text-gray-600 mt-2">Transactions are verified by a network of computers running consensus algorithms to validate the authenticity and prevent double-spending.</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-bold text-lg">Are blockchain transactions secure?</h3>
                <p className="text-gray-600 mt-2">Yes, blockchain transactions are secured using advanced cryptography and are distributed across a network of computers, making them extremely secure.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <BottomNavigation />
      <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}