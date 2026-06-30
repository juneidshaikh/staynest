import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "./jwt";
import { prisma } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { JWTPayload } from "@/types";

export type AuthenticatedRequest = NextRequest & {
  user: JWTPayload;
};

type Handler = (
  req: AuthenticatedRequest,
  ctx: any
) => Promise<Response | NextResponse>;

export function withAuth(handler: Handler, requiredRole?: UserRole) {
  return async (req: NextRequest, ctx: any) => {
    try {
      const authHeader = req.headers.get("authorization");
      const cookieToken = req.cookies.get("access_token")?.value;

      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : cookieToken;

      if (!token) {
        return NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        );
      }

      let payload: JWTPayload;

      try {
        payload = verifyAccessToken(token);
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid or expired token" },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          role: true,
          isActive: true,
          isBanned: true,
        },
      });

      if (!user || !user.isActive || user.isBanned) {
        return NextResponse.json(
          { success: false, error: "Account is not active" },
          { status: 403 }
        );
      }

      if (requiredRole) {
        const roleHierarchy: Record<UserRole, number> = {
          GUEST: 0,
          OWNER: 1,
          ADMIN: 2,
          SUPER_ADMIN: 3,
        };

        if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
          return NextResponse.json(
            { success: false, error: "Insufficient permissions" },
            { status: 403 }
          );
        }
      }

      const authenticatedReq = req as AuthenticatedRequest;
      authenticatedReq.user = {
        ...payload,
        role: user.role,
      };

      return handler(authenticatedReq, ctx);
    } catch (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
        },
        {
          status: 500,
        }
      );
    }
  };
}

export function withOptionalAuth(handler: Handler) {
  return async (req: NextRequest, ctx: any) => {
    try {
      const authHeader = req.headers.get("authorization");
      const cookieToken = req.cookies.get("access_token")?.value;

      const token = authHeader?.startsWith("Bearer ")
        ? authHeader.slice(7)
        : cookieToken;

      const authenticatedReq = req as AuthenticatedRequest;

      if (token) {
        try {
          authenticatedReq.user = verifyAccessToken(token);
        } catch {}
      }

      return handler(authenticatedReq, ctx);
    } catch (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
        },
        {
          status: 500,
        }
      );
    }
  };
}