"use client";

interface NumberGridProps {
  numberFrom: number;
  numberTo: number;
  tickets: Map<number, string>;
  selectedNumber: number | null;
  onSelect: (number: number) => void;
  status: string;
}

export function NumberGrid({
  numberFrom,
  numberTo,
  tickets,
  selectedNumber,
  onSelect,
  status,
}: NumberGridProps) {
  const numbers = Array.from(
    { length: numberTo - numberFrom + 1 },
    (_, i) => numberFrom + i
  );

  const numberWidth = numberTo.toString().length;
  const isActive = status === "active";

  return (
    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
      {numbers.map((num) => {
        const ticketStatus = tickets.get(num);
        const isSold = ticketStatus === "sold";
        const isReserved = ticketStatus === "reserved";
        const isSelected = selectedNumber === num;
        const canSelect = isActive && !isSold && !isReserved;

        return (
          <button
            key={num}
            onClick={() => canSelect && onSelect(num)}
            disabled={!canSelect}
            className={`aspect-square flex items-center justify-center rounded-xl text-sm font-bold border-2 transition-all duration-200 ${
              isSelected
                ? "bg-gradient-to-br from-amber-500 to-orange-500 border-amber-500 text-white shadow-lg shadow-amber-200 scale-105"
                : isSold
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed line-through"
                : isReserved
                ? "bg-amber-50 border-amber-200 text-amber-600 cursor-not-allowed"
                : canSelect
                ? "bg-white border-gray-200 text-gray-800 hover:border-amber-400 hover:bg-amber-50 active:scale-95"
                : "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {num.toString().padStart(numberWidth, "0")}
          </button>
        );
      })}
    </div>
  );
}
