import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const challenges = await prisma.challenge.findMany({
      orderBy: { day: 'asc' }
    })
    return NextResponse.json(challenges)
  } catch (error) {
    return NextResponse.json(
      { error: 'Kon challenges niet ophalen' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, day } = body

    const challenge = await prisma.challenge.create({
      data: {
        title,
        day,
      },
    })

    return NextResponse.json(challenge, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Kon challenge niet aanmaken' },
      { status: 500 }
    )
  }
}
