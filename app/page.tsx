"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0xDA0bab807633f07f013f94DD0E6A4F96F8742B53";

const ABI = [
  "function studentId() view returns (string)",
  "function studentName() view returns (string)",
  "function sign(string _message)",
  "function getEntriesCount() view returns (uint256)",
  "function getEntry(uint256) view returns (address, string memory, uint256)",
];

type Entry = {
  writer: string;
  msg: string;
  ts: string;
};

export default function Home() {
  const [account, setAccount] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (typeof window === "undefined") return;
    // @ts-expect-error
    if (!window.ethereum) {
      alert("MetaMask가 필요합니다.");
      return;
    }
    // @ts-expect-error
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(accounts[0]);
  };

  const loadEntries = async () => {
    if (typeof window === "undefined") return;
    // @ts-expect-error
    if (!window.ethereum) return;

    // @ts-expect-error
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const count: bigint = await contract.getEntriesCount();
    const arr: Entry[] = [];

    // 최근 것부터 10개만
    for (let i = Number(count) - 1; i >= 0 && arr.length < 10; i--) {
      const [writer, msg, ts] = await contract.getEntry(i);
      const dateStr = new Date(Number(ts) * 1000).toLocaleString();
      arr.push({
        writer,
        msg,
        ts: dateStr,
      });
    }

    setEntries(arr);
  };

  const submitMessage = async () => {
    if (!message.trim()) return;
    if (typeof window === "undefined") return;
    // @ts-expect-error
    if (!window.ethereum) return;

    setLoading(true);
    try {
      // @ts-expect-error
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      const tx = await contract.sign(message);
      await tx.wait();
      setMessage("");
      await loadEntries();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        padding: "24px",
      }}
    >
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>
        Web3 방명록 (92113748 윤현식)
      </h1>

      <div
        style={{
          background: "#1a1a1a",
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "16px",
        }}
      >
        <p>
          <strong>지갑</strong>: {account || "미연결"}
        </p>
        <p>네트워크: Sepolia</p>
        <button onClick={connectWallet} style={{ marginTop: "8px" }}>
          지갑 연결 / 새로고침
        </button>
      </div>

      <div
        style={{
          background: "#1a1a1a",
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "16px",
        }}
      >
        <p>
          <strong>메시지 남기기</strong>
        </p>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="수업 잘 듣고 갑니다 :)"
          style={{ width: "60%", padding: "6px", marginRight: "8px" }}
        />
        <button onClick={submitMessage} disabled={loading}>
          {loading ? "전송 중..." : "남기기"}
        </button>
      </div>

      <div
        style={{
          background: "#1a1a1a",
          padding: "16px",
          borderRadius: "12px",
        }}
      >
        <p>
          <strong>최근 메시지</strong>
        </p>
        {entries.length === 0 && <p>아직 아무도 안 남겼습니다.</p>}
        {entries.map((e, idx) => (
          <div
            key={idx}
            style={{ borderBottom: "1px solid #333", padding: "8px 0" }}
          >
            <p style={{ margin: 0 }}>{e.msg}</p>
            <p style={{ margin: 0, fontSize: "12px", color: "#aaa" }}>
              {e.writer} · {e.ts}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
