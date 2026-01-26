"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Image
          src="/404.png"
          alt="404 Not Found"
          width={600}
          height={400}
          className="mx-auto mb-8"
          priority
        />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          ページが見つかりません
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ホームに戻る
        </a>
      </div>
    </div>
  );
}