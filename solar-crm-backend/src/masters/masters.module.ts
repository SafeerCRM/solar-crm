import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MastersService } from './masters.service';
import { MastersController } from './masters.controller';
import { MasterData } from './master-data.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MasterData])],
  controllers: [MastersController],
  providers: [MastersService],
})
export class MastersModule {}