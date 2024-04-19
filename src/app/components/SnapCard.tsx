import type { CardData } from "../../server/routers";

export const SnapCard = ({
  card,
  notDrawn,
}: {
  card: CardData;
  notDrawn: boolean;
}) => {
  const url = `https://snapjson.untapped.gg/art/render/framebreak/common/256/${card.defId}.webp`;

  return (
    <div className="relative -mx-[20px] hover:z-50 hover:scale-110" title={card.name}>
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
           ${notDrawn ? "opacity-100" : "opacity-30"} ${
          notDrawn ? "scale-100" : "scale-90"
        }`}
      />
    </div>
  );
};
