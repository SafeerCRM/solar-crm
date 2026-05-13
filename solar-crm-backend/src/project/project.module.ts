import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectDocument } from './project-document.entity';
import { ProjectComment } from './project-comment.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { CalculatorModule } from '../calculator/calculator.module';
import { ProjectMaterialMaster } from './project-material-master.entity';
import { ProjectMaterialRequest } from './project-material-request.entity';
import { ProjectMaterialRequestItem } from './project-material-request-item.entity';
import { ProjectBranch } from './project-branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, ProjectDocument, ProjectComment, ProjectMaterialMaster, ProjectMaterialRequest,
ProjectMaterialRequestItem, ProjectBranch]),
    CalculatorModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}