import "server-only";
import { RiskLevel } from "@prisma/client";

export interface FloodPredictionInput {
  districtName?: string;
  rainfallMm: number;
  daysOfRain: number;
  slope: number; // in degrees or %
  soilSaturation: number; // 0 to 100 %
  elevation?: number | null; // meters
}

export interface FloodPredictionResult {
  riskLevel: RiskLevel;
  confidence: number;
  reasoning: string;
}

export async function predictFloodRisk(
  input: FloodPredictionInput,
): Promise<FloodPredictionResult> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  const prompt = `Analyze the flood risk for the given meteorological and terrain parameters in Rwanda:
District: ${input.districtName || "N/A"}
Rainfall Amount: ${input.rainfallMm} mm
Continuous Days of Rain: ${input.daysOfRain} days
Terrain Slope: ${input.slope}°
Soil Saturation Estimate: ${input.soilSaturation}%
Elevation: ${input.elevation ? `${input.elevation} m` : "N/A"}

Classify the flood risk into exactly one of: "LOW", "MEDIUM", "HIGH".
Provide a confidence percentage between 0 and 100.
Provide a concise, professional hydrological reasoning explaining the decision based on soil saturation, rainfall intensity, and terrain topology.

Respond with strict JSON matching this structure:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "confidence": number,
  "reasoning": "string"
}`;

  if (apiKey) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content:
                  "You are an expert hydrologist and environmental disaster AI specialist for Rwanda. Respond ONLY with valid JSON containing keys 'riskLevel' ('LOW', 'MEDIUM', or 'HIGH'), 'confidence' (number), and 'reasoning' (string).",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.1,
            response_format: { type: "json_object" },
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const contentStr = data.choices?.[0]?.message?.content;
        if (contentStr) {
          const parsed = JSON.parse(contentStr);
          const rawRisk = String(parsed.riskLevel).toUpperCase();
          let riskLevel: RiskLevel = RiskLevel.LOW;
          if (rawRisk === "HIGH") riskLevel = RiskLevel.HIGH;
          else if (rawRisk === "MEDIUM") riskLevel = RiskLevel.MEDIUM;

          const confidence = Math.min(
            100,
            Math.max(0, Number(parsed.confidence) || 85),
          );
          const reasoning = String(
            parsed.reasoning ||
              "Analysis generated based on hydrologic parameters.",
          );

          return { riskLevel, confidence, reasoning };
        }
      } else {
        const errText = await response.text();
        console.error("Groq API error response:", errText);
      }
    } catch (error) {
      console.error("Error calling Groq API:", error);
    }
  }

  // Hydrological rule-based fallback calculation if API fails or key is missing
  let score = 0;
  if (input.rainfallMm > 100) score += 40;
  else if (input.rainfallMm > 50) score += 25;
  else if (input.rainfallMm > 20) score += 10;

  if (input.soilSaturation > 85) score += 30;
  else if (input.soilSaturation > 60) score += 20;

  if (input.daysOfRain >= 5) score += 20;
  else if (input.daysOfRain >= 3) score += 10;

  if (input.slope < 10) score += 10; // low slope flat basins retain water

  let riskLevel: RiskLevel = RiskLevel.LOW;
  let confidence = 82;
  let reasoning =
    "Low precipitation and moderate soil capacity present minimal risk of surface inundation.";

  if (score >= 60) {
    riskLevel = RiskLevel.HIGH;
    confidence = 91;
    reasoning = `High risk detected: Intense cumulative rainfall (${input.rainfallMm}mm over ${input.daysOfRain} days) combined with high soil saturation (${input.soilSaturation}%) severely increases run-off and river overflow probability.`;
  } else if (score >= 35) {
    riskLevel = RiskLevel.MEDIUM;
    confidence = 86;
    reasoning = `Moderate risk detected: Elevated rainfall (${input.rainfallMm}mm) and soil saturation (${input.soilSaturation}%) warrant continuous monitoring of drainage channels and low-lying zones.`;
  }

  return { riskLevel, confidence, reasoning };
}
