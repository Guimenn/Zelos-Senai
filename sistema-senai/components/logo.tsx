import * as React from "react";

import Image from "next/image"

export default function Logo()  {
    return (
        <div className="w-48 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Image src="/senai-logo.png" alt="Logo" width={170} height={100} />
        </div>
    )
}