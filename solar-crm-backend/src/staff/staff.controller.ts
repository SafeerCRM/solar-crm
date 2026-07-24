import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { FilesInterceptor } from '@nestjs/platform-express';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OWNER', 'HR_MANAGER')
@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  findAll(@Query() query: any) {
    return this.staffService.findAll(query);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.staffService.create(body, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.staffService.update(Number(id), body);
  }

  @Patch(':id/hide')
  hide(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.staffService.hide(Number(id), body, user);
  }

  @Patch(':id/restore')
  restore(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.staffService.restore(Number(id), body, user);
  }

  @Patch(':id/photo')
  updatePhoto(@Param('id') id: string, @Body() body: any) {
    return this.staffService.updatePhoto(Number(id), body);
  }

  @Get(':id/documents')
  getDocuments(@Param('id') id: string) {
    return this.staffService.getDocuments(Number(id));
  }

  @Post('document')
  addDocument(@Body() body: any, @CurrentUser() user: any) {
    return this.staffService.addDocument(body, user);
  }

  @Patch('document/:id/hide')
  hideDocument(@Param('id') id: string) {
    return this.staffService.hideDocument(Number(id));
  }

  @Get(':id/assets')
  getAssets(@Param('id') id: string) {
    return this.staffService.getAssets(Number(id));
  }

  @Post('asset')
  addAsset(@Body() body: any) {
    return this.staffService.addAsset(body);
  }

  @Patch('asset/:id/hide')
  hideAsset(@Param('id') id: string) {
    return this.staffService.hideAsset(Number(id));
  }

  @Post('attendance/photo-upload')
@UseInterceptors(FilesInterceptor('files', 1))
uploadAttendancePhoto(@UploadedFiles() files: any[]) {
  const file = files?.[0];
  return this.staffService.uploadAttendancePhoto(file);
}

@Get('attendance')
getAttendance(@Query() query: any) {
  return this.staffService.getAttendance(query);
}

@Post('attendance/punch-in')
punchIn(@Body() body: any, @CurrentUser() user: any) {
  return this.staffService.punchIn(body, user);
}

@Post('attendance/punch-out')
punchOut(@Body() body: any, @CurrentUser() user: any) {
  return this.staffService.punchOut(body, user);
}

@Post('attendance-locations')
createAttendanceLocation(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.createAttendanceLocation(
    body,
    user,
  );
}

@Get('attendance-locations')
listAttendanceLocations(
  @Query() query: any,
) {
  return this.staffService.listAttendanceLocations(
    query,
  );
}

@Get('attendance-locations/active')
getActiveAttendanceLocations() {
  return this.staffService.getActiveAttendanceLocations();
}

@Get('attendance-locations/:id')
getAttendanceLocation(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.staffService.getAttendanceLocation(
    id,
  );
}

@Patch('attendance-locations/:id')
updateAttendanceLocation(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
) {
  return this.staffService.updateAttendanceLocation(
    id,
    body,
  );
}

@Patch('attendance-locations/:id/hide')
hideAttendanceLocation(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.staffService.hideAttendanceLocation(
    id,
  );
}

@Patch('attendance-locations/:id/restore')
restoreAttendanceLocation(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.staffService.restoreAttendanceLocation(
    id,
  );
}

@Post('attendance-policies')
saveStaffAttendancePolicy(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.saveStaffAttendancePolicy(
    body,
    user,
  );
}

@Get('attendance-policies')
listStaffAttendancePolicies(
  @Query() query: any,
) {
  return this.staffService.listStaffAttendancePolicies(
    query,
  );
}

@Get('attendance-policies/staff/:staffId')
getStaffAttendancePolicy(
  @Param('staffId', ParseIntPipe)
  staffId: number,
) {
  return this.staffService.getStaffAttendancePolicy(
    staffId,
  );
}

@Patch(
  'attendance-policies/staff/:staffId/active',
)
setStaffAttendancePolicyActive(
  @Param('staffId', ParseIntPipe)
  staffId: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  if (typeof body.isActive !== 'boolean') {
    throw new BadRequestException(
      'isActive must be true or false',
    );
  }

  return this.staffService.setStaffAttendancePolicyActive(
    staffId,
    body.isActive,
    user,
  );
}

@Post('attendance-overrides')
saveStaffAttendanceOverride(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.saveStaffAttendanceOverride(
    body,
    user,
  );
}

@Get('attendance-overrides')
listStaffAttendanceOverrides(
  @Query() query: any,
) {
  return this.staffService.listStaffAttendanceOverrides(
    query,
  );
}

@Get('attendance-overrides/:id')
getStaffAttendanceOverride(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.staffService.getStaffAttendanceOverride(
    id,
  );
}

@Patch('attendance-overrides/:id/active')
setStaffAttendanceOverrideActive(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  if (typeof body.isActive !== 'boolean') {
    throw new BadRequestException(
      'isActive must be true or false',
    );
  }

  return this.staffService.setStaffAttendanceOverrideActive(
    id,
    body.isActive,
    user,
  );
}

@Get('attendance-exception-requests')
listAttendanceExceptionRequests(
  @Query() query: any,
) {
  return this.staffService.listAttendanceExceptionRequests(
    query,
  );
}

@Get('attendance-exception-requests/:id')
getAttendanceExceptionRequest(
  @Param('id', ParseIntPipe) id: number,
) {
  return this.staffService.getAttendanceExceptionRequest(
    id,
  );
}

@Patch(
  'attendance-exception-requests/:id/review',
)
reviewAttendanceExceptionRequest(
  @Param('id', ParseIntPipe) id: number,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.reviewAttendanceExceptionRequest(
    id,
    body,
    user,
  );
}

@Get('me')
getMyStaffProfile(@CurrentUser() user: any) {
  return this.staffService.getMyStaffProfile(user);
}

@Get('leaves')
listLeaves(@Query() query: any) {
  return this.staffService.listLeaves(query);
}

@Post('leave')
createLeave(@Body() body: any, @CurrentUser() user: any) {
  return this.staffService.createLeave(body, user);
}

@Patch('leave/:id')
updateLeave(@Param('id') id: string, @Body() body: any) {
  return this.staffService.updateLeave(Number(id), body);
}

@Patch('leave/:id/approve')
approveLeave(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.approveLeave(Number(id), body, user);
}

@Patch('leave/:id/reject')
rejectLeave(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.rejectLeave(Number(id), body, user);
}

@Patch('leave/:id/hide')
hideLeave(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.hideLeave(Number(id), body, user);
}

@Patch('leave/:id/restore')
restoreLeave(@Param('id') id: string) {
  return this.staffService.restoreLeave(Number(id));
}

@Post('leave/proof-upload')
@UseInterceptors(FilesInterceptor('files', 1))
uploadLeaveProof(@UploadedFiles() files: any[]) {
  const file = files?.[0];
  return this.staffService.uploadLeaveProof(file);
}

@Get('employee-policies')
listEmployeePolicies(@Query() query: any) {
  return this.staffService.listEmployeePolicies(query);
}

@Post('employee-policy')
createEmployeePolicy(@Body() body: any, @CurrentUser() user: any) {
  return this.staffService.createEmployeePolicy(body, user);
}

@Patch('employee-policy/:id')
updateEmployeePolicy(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.updateEmployeePolicy(Number(id), body, user);
}

@Patch('employee-policy/:id/hide')
hideEmployeePolicy(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.hideEmployeePolicy(Number(id), body, user);
}

@Patch('employee-policy/:id/restore')
restoreEmployeePolicy(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.restoreEmployeePolicy(Number(id), body, user);
}

@Post('employee-policy/file-upload')
@UseInterceptors(FilesInterceptor('files', 1))
uploadEmployeePolicyFile(@UploadedFiles() files: any[]) {
  const file = files?.[0];
  return this.staffService.uploadEmployeePolicyFile(file);
}

@Roles('OWNER', 'HR_MANAGER', 'SOLAR_FRANCHISE')
@Get('solar-franchise-policies')
listVisibleSolarFranchisePolicies(@Query() query: any) {
  return this.staffService.listVisibleSolarFranchisePolicies(query);
}

@Get('hr-settings')
listHrSettings(@Query() query: any) {
  return this.staffService.listHrSettings(query);
}

@Get('hr-settings/:type')
getHrSettingByType(@Param('type') type: string) {
  return this.staffService.getHrSettingByType(type);
}

@Patch('hr-settings/:type')
saveHrSetting(
  @Param('type') type: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.saveHrSetting(type, body, user);
}

@Patch('hr-settings/:id/hide')
hideHrSetting(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.hideHrSetting(Number(id), body, user);
}

@Patch('hr-settings/:id/restore')
restoreHrSetting(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.restoreHrSetting(Number(id), body, user);
}

@Get('payrolls')
listPayrolls(@Query() query: any) {
  return this.staffService.listPayrolls(query);
}

@Post('payroll/generate')
generatePayroll(@Body() body: any, @CurrentUser() user: any) {
  return this.staffService.generatePayroll(body, user);
}

@Patch('payroll/:id')
updatePayroll(@Param('id') id: string, @Body() body: any) {
  return this.staffService.updatePayroll(Number(id), body);
}

@Patch('payroll/:id/approve')
approvePayroll(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.approvePayroll(Number(id), body, user);
}

@Patch('payroll/:id/paid')
markPayrollPaid(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.markPayrollPaid(Number(id), body, user);
}

@Patch('payroll/:id/hide')
hidePayroll(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.hidePayroll(Number(id), body, user);
}

@Patch('payroll/:id/restore')
restorePayroll(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.restorePayroll(Number(id), body, user);
}

@Get('incentive-rules')
listIncentiveRules(@Query() query: any) {
  return this.staffService.listIncentiveRules(query);
}

@Post('incentive-rule')
createIncentiveRule(@Body() body: any, @CurrentUser() user: any) {
  return this.staffService.createIncentiveRule(body, user);
}

@Patch('incentive-rule/:id')
updateIncentiveRule(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.updateIncentiveRule(Number(id), body, user);
}

@Patch('incentive-rule/:id/hide')
hideIncentiveRule(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.hideIncentiveRule(Number(id), body, user);
}

@Patch('incentive-rule/:id/restore')
restoreIncentiveRule(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.restoreIncentiveRule(Number(id), body, user);
}

@Get('recruitment-candidates')
listRecruitmentCandidates(@Query() query: any) {
  return this.staffService.listRecruitmentCandidates(query);
}

@Post('recruitment-candidate')
createRecruitmentCandidate(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.createRecruitmentCandidate(body, user);
}

@Patch('recruitment-candidate/:id')
updateRecruitmentCandidate(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.updateRecruitmentCandidate(Number(id), body, user);
}

@Patch('recruitment-candidate/:id/hide')
hideRecruitmentCandidate(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.hideRecruitmentCandidate(Number(id), body, user);
}

@Patch('recruitment-candidate/:id/restore')
restoreRecruitmentCandidate(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.restoreRecruitmentCandidate(Number(id), body, user);
}

@Post('recruitment/file-upload')
@UseInterceptors(FilesInterceptor('files', 1))
uploadRecruitmentFile(@UploadedFiles() files: any[]) {
  const file = files?.[0];
  return this.staffService.uploadRecruitmentFile(file);
}

@Get('recruitment-candidate/:id/documents')
listRecruitmentCandidateDocuments(@Param('id') id: string) {
  return this.staffService.listRecruitmentCandidateDocuments(Number(id));
}

@Post('recruitment-candidate/document')
addRecruitmentCandidateDocument(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.addRecruitmentCandidateDocument(body, user);
}

@Patch('recruitment-candidate/document/:id/hide')
hideRecruitmentCandidateDocument(@Param('id') id: string) {
  return this.staffService.hideRecruitmentCandidateDocument(Number(id));
}

@Get('performance-templates')
listPerformanceTemplates(@Query() query: any) {
  return this.staffService.listPerformanceTemplates(query);
}

@Post('performance-template')
createPerformanceTemplate(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.createPerformanceTemplate(body, user);
}

@Get('performance-template/:id/metrics')
getPerformanceTemplateMetrics(@Param('id') id: string) {
  return this.staffService.getPerformanceTemplateMetrics(Number(id));
}

@Patch('performance-template/:id')
updatePerformanceTemplate(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.updatePerformanceTemplate(Number(id), body, user);
}

@Patch('performance-template/:id/hide')
hidePerformanceTemplate(@Param('id') id: string) {
  return this.staffService.hidePerformanceTemplate(Number(id));
}

@Patch('performance-template/:id/restore')
restorePerformanceTemplate(@Param('id') id: string) {
  return this.staffService.restorePerformanceTemplate(Number(id));
}

@Get('penalty-rules')
listPenaltyRules(@Query() query: any) {
  return this.staffService.listPenaltyRules(query);
}

@Post('penalty-rule')
createPenaltyRule(
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.createPenaltyRule(body, user);
}

@Patch('penalty-rule/:id')
updatePenaltyRule(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.updatePenaltyRule(
    Number(id),
    body,
    user,
  );
}

@Patch('penalty-rule/:id/hide')
hidePenaltyRule(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.hidePenaltyRule(
    Number(id),
    body,
    user,
  );
}

@Patch('penalty-rule/:id/restore')
restorePenaltyRule(
  @Param('id') id: string,
  @Body() body: any,
  @CurrentUser() user: any,
) {
  return this.staffService.restorePenaltyRule(
    Number(id),
    body,
    user,
  );
}
}