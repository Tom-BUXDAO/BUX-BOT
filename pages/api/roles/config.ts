import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getSession } from 'next-auth/react';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  
  // Add proper admin check here
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      const configs = await prisma.roleConfig.findMany();
      return res.status(200).json(configs);

    case 'POST':
      const newConfig = await prisma.roleConfig.create({
        data: req.body
      });
      return res.status(201).json(newConfig);

    case 'PUT':
      const { id, ...data } = req.body;
      const updatedConfig = await prisma.roleConfig.update({
        where: { id },
        data
      });
      return res.status(200).json(updatedConfig);

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 