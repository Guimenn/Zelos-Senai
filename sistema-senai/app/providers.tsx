"use client";

import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import {ToastProvider} from "@heroui/toast";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "../components/theme-provider";
import { SidebarProvider } from "../contexts/SidebarContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { I18nProvider } from "../contexts/I18nContext";

export interface ProvidersProps {
  children: React.ReactNode;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

export function Providers({ children }: ProvidersProps) {
  const router = useRouter();

  return (
    <HeroUIProvider navigate={router.push}>
      <ThemeProvider>
        <SidebarProvider>
          <NotificationProvider>
            <I18nProvider>
              {children}
              <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
            </I18nProvider>
          </NotificationProvider>
        </SidebarProvider>
      </ThemeProvider>
    </HeroUIProvider>
  );
}
