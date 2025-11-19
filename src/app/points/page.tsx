"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Star, TrendingUp, TrendingDown, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import Image from "next/image";
import { getCustomerSession, validateAndRefreshSession } from "@/lib/customerSession";

interface TopupOffer {
  id: string;
  amount: number;
  points: number;
  bonus_points: number;
  description: string;
}

export default function PointsPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState<any>(null);
  const [pointTransactions, setPointTransactions] = useState<any[]>([]);
  const [topupOffers, setTopupOffers] = useState<TopupOffer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const session = getCustomerSession();
      if (!session) {
        router.push("/");
        return;
      }

      // Validate session
      const isValid = await validateAndRefreshSession();
      if (!isValid) {
        router.push("/");
        return;
      }

      setCustomerId(session.customerId);
      loadData(session.customerId);
    };

    checkSession();
  }, [router]);

  const loadData = async (id: string) => {
    try {
      setIsLoading(true);
      
      // Load customer profile
      const profileRes = await apiClient.getCustomerProfile(id);
      if (profileRes.success && profileRes.data) {
        setLoyaltyPoints(profileRes.data.loyaltyPoints);
      }

      // Load point transactions
      const pointsRes = await apiClient.getLoyaltyPointTransactions(id, 50);
      if (pointsRes.success && pointsRes.data) {
        setPointTransactions(pointsRes.data);
      }

      // Load top-up offers
      const offersRes = await apiClient.getTopupOffers();
      if (offersRes.success && offersRes.data) {
        setTopupOffers(offersRes.data);
      }
    } catch (error) {
      toast.error("Failed to load points data");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!customerId) {
      toast.error("Customer ID not found");
      return;
    }

    let amount = 0;
    let offerId = null;

    if (selectedOffer) {
      const offer = topupOffers.find(o => o.id === selectedOffer);
      if (!offer) {
        toast.error("Selected offer not found");
        return;
      }
      amount = offer.amount;
      offerId = offer.id;
    } else if (customAmount) {
      amount = parseFloat(customAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
    } else {
      toast.error("Please select an offer or enter a custom amount");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiClient.processTopup(customerId, amount, offerId || undefined);
      if (response.success) {
        const data = response.data;
        const message = data.bonusPoints > 0
          ? `Top-up successful! Added ${data.totalPoints} points (${data.basePoints} + ${data.bonusPoints} bonus)`
          : `Top-up successful! Added ${data.totalPoints} points`;
        toast.success(message);
        setSelectedOffer(null);
        setCustomAmount("");
        loadData(customerId);
      } else {
        throw new Error(response.error || "Failed to process top-up");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process top-up");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cafe-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-cafe-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cafe-dark/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cafe-light pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cafe-cream shadow-md h-[72px] flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="relative w-20 h-20">
          <Image
            src="/logo.png"
            alt="Fourth Coffee"
            fill
            className="object-contain"
            sizes="80px"
            priority
          />
        </div>
        <h1 className="ml-4 text-2xl font-bold text-cafe-dark">My Points</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Points Summary */}
        <Card className="p-6 bg-gradient-to-br from-cafe-gold to-cafe-accent text-white">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-8 h-8" />
            <span className="text-lg opacity-90">Loyalty Points</span>
          </div>
          <div className="text-4xl font-bold mb-2">{loyaltyPoints?.points || 0}</div>
          <div className="text-sm opacity-80">
            Earned: {loyaltyPoints?.earned_points || 0} | Redeemed: {loyaltyPoints?.redeemed_points || 0}
          </div>
          <div className="text-xs opacity-70 mt-2">
            1 Point = ₹1
          </div>
        </Card>

        {/* Top Up Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-cafe-gold" />
            <h2 className="text-lg font-bold text-cafe-dark">Top Up Points</h2>
          </div>

          {/* Top-up Offers */}
          {topupOffers.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-cafe-dark/70 mb-3">Select an offer:</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {topupOffers.map((offer) => (
                  <motion.button
                    key={offer.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedOffer(offer.id);
                      setCustomAmount("");
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedOffer === offer.id
                        ? "border-cafe-gold bg-cafe-gold/10"
                        : "border-cafe-cream hover:border-cafe-gold/50"
                    }`}
                  >
                    <div className="font-bold text-cafe-dark">₹{offer.amount}</div>
                    <div className="text-sm text-cafe-dark/70 mt-1">
                      {offer.points} points
                      {offer.bonus_points > 0 && (
                        <span className="text-green-600 font-semibold ml-1">
                          +{offer.bonus_points} bonus
                        </span>
                      )}
                    </div>
                    {offer.bonus_points > 0 && (
                      <Badge className="mt-2 bg-green-500 text-white text-xs">
                        Save {offer.bonus_points} points
                      </Badge>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Amount */}
          <div className="mb-4">
            <p className="text-sm text-cafe-dark/70 mb-2">Or enter custom amount:</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Enter amount (₹)"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedOffer(null);
                }}
                className="flex-1 h-12 px-4 border-2 border-cafe-gold/30 rounded-lg focus:outline-none focus:border-cafe-gold"
                min="1"
              />
              {customAmount && parseFloat(customAmount) > 0 && (
                <div className="flex items-center text-sm text-cafe-dark/70">
                  = {Math.floor(parseFloat(customAmount))} points
                </div>
              )}
            </div>
          </div>

          {/* Top-up Button */}
          <Button
            onClick={handleTopup}
            disabled={isProcessing || (!selectedOffer && !customAmount)}
            className="w-full h-12 bg-cafe-dark hover:bg-cafe-gold text-white"
          >
            {isProcessing ? "Processing..." : "Top Up Now"}
          </Button>

          <p className="text-xs text-cafe-dark/60 mt-3 text-center">
            💡 Tip: Select offers with bonus points to get more value!
          </p>
        </Card>

        {/* Point Transactions */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-cafe-dark mb-4">Point History</h2>
          <div className="space-y-3">
            {pointTransactions.length === 0 ? (
              <p className="text-center text-cafe-dark/70 py-8">No transactions yet</p>
            ) : (
              pointTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-cafe-cream/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {transaction.transaction_type === "earned" || transaction.transaction_type === "topup" ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold text-cafe-dark">
                        {transaction.transaction_type === "earned" && "Earned"}
                        {transaction.transaction_type === "topup" && "Top-up"}
                        {transaction.transaction_type === "redeemed" && "Redeemed"}
                        {" "}{transaction.points} points
                      </p>
                      <p className="text-sm text-cafe-dark/70">{transaction.description || "Transaction"}</p>
                      <p className="text-xs text-cafe-dark/50">{formatDate(transaction.created_at)}</p>
                    </div>
                  </div>
                  <Badge
                    variant={transaction.transaction_type === "redeemed" ? "secondary" : "default"}
                    className={
                      transaction.transaction_type === "redeemed"
                        ? "bg-red-500"
                        : "bg-green-500"
                    }
                  >
                    {transaction.transaction_type === "redeemed" ? "-" : "+"}
                    {transaction.points}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
