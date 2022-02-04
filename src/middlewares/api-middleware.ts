/**
 * @description Verifica se o token do usuário está válido
 * @author GuilhermeSantos001
 * @update 03/02/2022
 */
import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { decompressFromBase64 } from 'lz-string';

import getReqProps from '../utils/getReqProps';

export default async function asyAPIMiddleware(req: Request, res: Response, next: NextFunction) {
    const { authorization } = getReqProps(req, ['authorization']),
        code = createHash('sha256').update(process.env.API_AUTHORIZATION || "").digest('hex');

    if (
        !authorization ||
        code != authorization &&
        code != decompressFromBase64(authorization)
    )
        return res.status(500).send({
            success: false,
            message: "You don't have permission to access this resource"
        })

    return next();
};