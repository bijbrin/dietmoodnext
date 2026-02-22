import { NextRequest, NextResponse } from 'next/server';

// CORS headers for PWA
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    
    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    const apiKey = process.env.KIMI_API_KEY || '';
    const endpoint = 'https://api.kimi.com/coding';
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    const base64 = image.split(',')[1];

    // Kimi Coding uses Anthropic Messages API format
    const res = await fetch(`${endpoint}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'k2p5',
        max_tokens: 1024,
        system: 'You are a food recognition expert. Analyze the food image and respond ONLY with valid JSON in this exact format: {"foodName": "string", "ingredients": ["item1", "item2"], "calories": number, "notes": "string"}. Be specific and accurate.',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64
                }
              },
              {
                type: 'text',
                text: 'What food is this? List ingredients and estimate calories. Return JSON only.'
              }
            ]
          }
        ]
      }),
    });

    const responseText = await res.text();

    if (!res.ok) {
      return NextResponse.json({
        error: `API error: ${res.status}`,
        raw: responseText
      }, { status: res.status, headers: corsHeaders });
    }

    const data = JSON.parse(responseText);
    const content = data.content?.[0]?.text || '{}';

    // Parse JSON from response
    let parsed: {
      foodName?: string;
      foods?: string[];
      ingredients?: string[];
      calories?: number;
      notes?: string;
    } = {};

    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        content.match(/```\n?([\s\S]*?)\n?```/) ||
                        content.match(/({[\s\S]*})/);

      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      parsed = {
        foodName: content.slice(0, 50) || 'Food detected',
        ingredients: [],
        calories: 0,
        notes: 'Could not parse structured data'
      };
    }

    return NextResponse.json({
      foodName: parsed.foodName || parsed.foods?.join(', ') || 'Food detected',
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients.join(', ') : '',
      calories: parsed.calories || 0,
      notes: parsed.notes || '',
      raw: content
    }, { headers: corsHeaders });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500, headers: corsHeaders });
  }
}
