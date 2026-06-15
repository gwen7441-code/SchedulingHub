import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { NotificationsController } from "./notifications.controller.js";
import { NotificationsService } from "./notifications.service.js";

@Module({
  imports: [
    BullModule.registerQueue({ name: "push" }),
    BullModule.registerQueue({ name: "email" })
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
