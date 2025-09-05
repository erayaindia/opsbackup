import { Aspect } from "../types";

/**
 * Maps aspect ratio enum values to Tailwind aspect ratio classes
 */
export const getAspectClass = (aspect: Aspect = "16:9"): string => {
  const aspectMap: Record<Aspect, string> = {
    "16:9": "aspect-video", // 16:9 ratio
    "9:16": "aspect-[9/16]", // 9:16 ratio (portrait video)
    "1:1": "aspect-square", // 1:1 ratio
    "4:5": "aspect-[4/5]", // 4:5 ratio (common for social media)
  };

  return aspectMap[aspect] || aspectMap["16:9"];
};

/**
 * Gets the numeric aspect ratio for calculations
 */
export const getAspectRatio = (aspect: Aspect = "16:9"): number => {
  const ratioMap: Record<Aspect, number> = {
    "16:9": 16 / 9,
    "9:16": 9 / 16, 
    "1:1": 1,
    "4:5": 4 / 5,
  };

  return ratioMap[aspect] || ratioMap["16:9"];
};