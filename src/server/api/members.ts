import { prisma } from '../db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const member = await prisma.member.create({
      data: {
        ...data,
        id: crypto.randomUUID(),
      },
    });

    return new Response(JSON.stringify(member), {
      status: 201,
    });
  } catch (error) {
    return new Response('Failed to create member', {
      status: 500,
    });
  }
} 