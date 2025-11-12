import {
  Trophy,
  Shield,
  Sparkles,
  Flame,
  Stars,
  Rocket,
  Diamond,
  Medal,
  Flag,
  Crown
} from "lucide-react";

export const LEAGUE_ICON_OPTIONS = [
  { id: "trophy", label: "Trophy", icon: Trophy },
  { id: "shield", label: "Shield", icon: Shield },
  { id: "sparkles", label: "Sparkles", icon: Sparkles },
  { id: "flame", label: "Flame", icon: Flame },
  { id: "stars", label: "Stars", icon: Stars },
  { id: "rocket", label: "Rocket", icon: Rocket },
  { id: "diamond", label: "Diamond", icon: Diamond },
  { id: "medal", label: "Medal", icon: Medal },
  { id: "flag", label: "Flag", icon: Flag },
  { id: "crown", label: "Crown", icon: Crown }
];

export const DEFAULT_LEAGUE_ICON_ID = "trophy";

const leagueIconMap = LEAGUE_ICON_OPTIONS.reduce((acc, option) => {
  acc[option.id] = option.icon;
  return acc;
}, {});

export const extractLeagueIconId = (value) => {
  if (typeof value !== "string") return null;
  return value.startsWith("icon:") ? value.slice(5) : null;
};

export const getLegacyLeagueLogoUrl = (league, palette = "yellow,orange,red", size = 160) => {
  const trimmedLogo =
    league?.leagueLogoUrl && typeof league.leagueLogoUrl === "string"
      ? league.leagueLogoUrl.trim()
      : "";
  if (trimmedLogo && !trimmedLogo.startsWith("icon:")) {
    return trimmedLogo;
  }
  const seed = league?.name || "League";
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=${palette}&size=${size}`;
};

export const LeagueIconDisplay = ({
  league,
  iconId,
  size = 56,
  className = "",
  rounded = true
}) => {
  const resolvedIconId =
    iconId || extractLeagueIconId(league?.leagueLogoUrl) || DEFAULT_LEAGUE_ICON_ID;
  const IconComponent = leagueIconMap[resolvedIconId] || Trophy;

  if (league?.leagueLogoUrl && !resolvedIconId && league.leagueLogoUrl.startsWith("http")) {
    const legacyUrl = getLegacyLeagueLogoUrl(league);
    return (
      <img
        src={legacyUrl}
        alt={league?.name || "League"}
        className={`${rounded ? "rounded-full" : "rounded-2xl"} object-cover shadow-md border ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = getLegacyLeagueLogoUrl({ name: league?.name || "League" });
        }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-yellow-400/30 to-orange-400/30 text-yellow-600 shadow-md border border-yellow-200 ${rounded ? "rounded-full" : "rounded-2xl"} ${className}`}
      style={{ width: size, height: size }}
    >
      <IconComponent className="w-[60%] h-[60%]" />
    </div>
  );
};

