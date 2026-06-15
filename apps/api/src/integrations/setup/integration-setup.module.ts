import { Module } from "@nestjs/common";
import { DynamicsModule } from "../dynamics/dynamics.module.js";
import { IntegrationSetupController } from "./integration-setup.controller.js";
import { IntegrationSetupService } from "./integration-setup.service.js";

@Module({
  imports: [DynamicsModule],
  controllers: [IntegrationSetupController],
  providers: [IntegrationSetupService]
})
export class IntegrationSetupModule {}
