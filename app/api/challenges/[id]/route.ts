import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
    })

    if (!challenge) {
      return NextResponse.json(
        { error: 'Challenge niet gevonden' },
        { status: 404 }
      )
    }

    return NextResponse.json(challenge)
  } catch (error) {
    return NextResponse.json(
      { error: 'Kon challenge niet ophalen' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { completed } = body

    const challenge = await prisma.challenge.update({
      where: { id: params.id },
      data: { completed },
    })

    return NextResponse.json(challenge)
  } catch (error) {
    return NextResponse.json(
      { error: 'Kon challenge niet updaten' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.challenge.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Challenge verwijderd' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Kon challenge niet verwijderen' },
      { status: 500 }
    )
  }
}
