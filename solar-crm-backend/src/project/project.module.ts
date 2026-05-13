import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectDocument } from './project-document.entity';
import { ProjectComment } from './project-comment.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { CalculatorModule } from '../calculator/calculator.module';
import { ProjectMaterialMaster } from './project-material-master.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectDocument, ProjectComment, ProjectMaterialMaster]),
    CalculatorModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}