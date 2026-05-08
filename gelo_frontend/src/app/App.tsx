import { RouterProvider, createBrowserRouter } from "react-router";
import routes from "~react-pages";
import { ToastProvider } from "@/components/shared/ui/ToastProvider";

const router = createBrowserRouter(routes);

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
