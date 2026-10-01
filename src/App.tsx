import { MobileRuntime } from "./mobile";
import Prototype from "./Prototype";

export default function App() {
  return (
    <MobileRuntime allowedDevices={["iphone"]}>
      <Prototype />
    </MobileRuntime>
  );
}
