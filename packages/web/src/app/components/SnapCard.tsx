import type { CardData } from "@local/server/src/routers";

export const SnapCard = ({ card }: { card: CardData }) => {
  const url = `https://snapjson.untapped.gg/art/render/framebreak/common/256/${card.defId}.webp`;

  return (
    <div
      className="relative -mx-[20px] hover:z-50 hover:scale-110"
      title={card.name}
    >
      <div
        className={`bg-[url(/assets/images/cost-image.webp)] bg-cover absolute top-0 z-50 left-5 text-white px-2 w-6 h-6 flex items-center justify-center`}
      >
        <span className="ml-1 text-xs font-bold">{card.cost}</span>
      </div>
      <div
        className={`bg-[url(/assets/images/power-image.webp)] bg-cover absolute top-0 z-50 right-6 text-white px-2 w-6 h-6 flex items-center justify-center`}
      >
        <span className="mt-1 text-xs font-bold">{card.power}</span>
      </div>
      <img
        src={url}
        alt={card.defId}
        className={`h-32 cursor-pointer object-cover transition-all duration-400
           ${card.drawn ? "opacity-30" : "opacity-100"} ${
          card.drawn ? "scale-90" : "scale-100"
        }`}
      />
    </div>
  );
};
