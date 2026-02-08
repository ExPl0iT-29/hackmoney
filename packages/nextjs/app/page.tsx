"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { LockClosedIcon, LockOpenIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { EtherInput } from "@scaffold-ui/components";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { parseEther } from "viem";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [lockAmount, setLockAmount] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<bigint>(0n);

  const { data: balance } = useScaffoldReadContract({
    contractName: "HODLVault",
    functionName: "balances",
    args: [connectedAddress],
    watch: true,
  });

  const { data: lockTimestamp } = useScaffoldReadContract({
    contractName: "HODLVault",
    functionName: "lockTimestamps",
    args: [connectedAddress],
    watch: true,
  });

  const { writeContractAsync: writeHODLVault } = useScaffoldWriteContract({
    contractName: "HODLVault",
  });

  useEffect(() => {
    const updateTimer = () => {
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (lockTimestamp && lockTimestamp > now) {
        setTimeRemaining(lockTimestamp - now);
      } else {
        setTimeRemaining(0n);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockTimestamp]);

  const handleLock = async () => {
    if (!lockAmount) return;
    try {
      await writeHODLVault({
        functionName: "lockFunds",
        value: parseEther(lockAmount),
      });
      setLockAmount("");
    } catch (e) {
      console.error("Error locking funds", e);
    }
  };


  const handleWithdraw = async () => {
    try {
      await writeHODLVault({
        functionName: "withdraw",
      });
    } catch (e) {
      console.error("Error withdrawing funds", e);
    }
  };

  const formatTime = (seconds: bigint) => {
    const s = Number(seconds);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const isLocked = timeRemaining > 0n;
  const hasBalance = balance && balance > 0n;

  return (
    <div className="flex items-center flex-col grow pt-10 bg-gradient-to-b from-base-100 to-base-300 min-h-screen">
      <div className="max-w-md w-full px-6 py-12 bg-base-100 rounded-3xl shadow-2xl border border-primary/20 backdrop-blur-sm bg-opacity-80">
        <div className="flex flex-col items-center mb-10">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            {isLocked ? (
              <LockClosedIcon className="h-12 w-12 text-primary animate-pulse" />
            ) : (
              <LockOpenIcon className="h-12 w-12 text-secondary" />
            )}
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            The HODL Vault
          </h1>
          <p className="text-gray-500 mt-2 text-center">
            The ultimate forced savings mechanism. Lock your ETH for 24 hours.
          </p>
        </div>

        {!connectedAddress ? (
          <div className="text-center py-8">
            <p className="mb-4 font-medium italic text-warning">Please connect your wallet to start HODLing.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Status Dashboard */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-base-200 p-4 rounded-2xl border border-primary/10 transition-all hover:shadow-md">
                <p className="text-xs uppercase font-bold text-gray-500 mb-1">Locked Balance</p>
                <p className="text-xl font-bold font-mono">
                  {balance ? formatEther(balance) : "0"} <span className="text-sm">ETH</span>
                </p>
              </div>
              <div className="bg-base-200 p-4 rounded-2xl border border-primary/10 transition-all hover:shadow-md">
                <p className="text-xs uppercase font-bold text-gray-500 mb-1">Unlock Timer</p>
                <p className={`text-xl font-bold font-mono ${isLocked ? "text-primary" : "text-success"}`}>
                  {isLocked ? formatTime(timeRemaining) : "Unlocked"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 pt-4 border-t border-primary/10">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-bold pl-2">Amount to Lock (24h)</label>
                <EtherInput
                  onValueChange={({ valueInEth }) => setLockAmount(valueInEth)}
                  placeholder="0.01"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  className="btn btn-primary btn-md rounded-xl font-bold shadow-lg hover:shadow-primary/20 transition-all"
                  onClick={handleLock}
                  disabled={!lockAmount || Number(lockAmount) <= 0}
                >
                  <LockClosedIcon className="h-5 w-5 mr-1" />
                  Lock ETH
                </button>
                <button
                  className={`btn btn-secondary btn-md rounded-xl font-bold shadow-lg transition-all ${!isLocked && hasBalance ? "hover:shadow-secondary/20" : ""
                    }`}
                  onClick={handleWithdraw}
                  disabled={isLocked || !hasBalance}
                >
                  {isLocked ? (
                    <ArrowPathIcon className="h-5 w-5 mr-1 animate-spin" />
                  ) : (
                    <LockOpenIcon className="h-5 w-5 mr-1" />
                  )}
                  Withdraw
                </button>
              </div>
            </div>

            {isLocked && (
              <div className="bg-primary/5 p-4 rounded-xl text-sm italic text-center text-primary border border-primary/20">
                Patience is a virtue. Your funds are being guarded by code.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 text-gray-400 text-sm flex items-center space-x-2">
        <span>Built with</span>
        <span className="font-bold text-primary">Scaffold-ETH 2</span>
        <span>&middot;</span>
        <span>Minimalist Architecture</span>
      </div>
    </div>
  );
};

export default Home;

