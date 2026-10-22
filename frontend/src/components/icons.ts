import { BookOpen, Cpu, FlaskConical, Rocket, ShieldCheck, Star, Target, Trophy, type LucideIcon } from "lucide-react";

export const BADGE_ICONS: Record<string, LucideIcon> = {
  "first-steps": Rocket,
  "sharp-shooter": Target,
  "rising-star": Star,
  "quiz-master": Trophy,
};

export const TOPIC_ICONS: Record<string, LucideIcon> = {
  Technology: Cpu,
  "Online Safety": ShieldCheck,
  Science: FlaskConical,
};

export const topicIcon = (topic: string) => TOPIC_ICONS[topic] ?? BookOpen;
export const badgeIcon = (code: string) => BADGE_ICONS[code] ?? Star;
