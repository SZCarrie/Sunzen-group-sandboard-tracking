export type Locale = "zh" | "en";

interface DictShape {
  common: {
    appName: string;
    headerBrand: string;
    headerTagline: string;
    save: string;
    cancel: string;
    signOut: string;
    create: string;
    edit: string;
    close: string;
    noPermission: string;
  };
  login: {
    signInSubtitle: string;
    signUpSubtitle: string;
    forgotSubtitle: string;
    namePlaceholder: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    newPasswordPlaceholder: string;
    signIn: string;
    signUp: string;
    processing: string;
    toggleToSignUp: string;
    toggleToSignIn: string;
    forgotPasswordLink: string;
    backToSignIn: string;
    signUpNotice: string;
    sendResetLink: string;
    resetLinkSentNotice: string;
    resetPasswordTitle: string;
    resetPasswordSubtitle: string;
    resetPasswordButton: string;
    resetPasswordSuccessNotice: string;
    resetLinkInvalid: string;
  };
  mySandbox: {
    title: string;
    noActiveCycle: string;
    footerNote: string;
    adminLink: string;
    statusLabel: string;
    cadenceLabel: string;
    requiredCountLabel: string;
    quarterly: string;
    monthly: string;
    submitButton: string;
    submitIncompleteHint: string;
    submittedNotice: string;
  };
  sandboxForm: {
    save: string;
    inheritedFrom: string;
    notFilledByManager: string;
    uploadLabel: string;
    existingFiles: string;
    noFilesYet: string;
    removeFile: string;
    notFilled: string;
    lockedNote: string;
    addBlankRowsHint: string;
    goalGroupTitle: { annual_business: string; annual_team: string; annual_personal: string; annual_work: string };
    addGoal: string;
    titlePlaceholder: string;
    descriptionPlaceholder: string;
    targetValuePlaceholder: string;
    goalPlanningLabel: string;
    goalPlanningPlaceholder: string;
    implementationStepLabel: string;
    implementationStepPlaceholder: string;
    startDate: string;
    endDate: string;
    statusLabel: string;
    goalStatus: { not_started: string; in_progress: string; at_risk: string; completed: string };
    progressHistory: string;
    noProgressYet: string;
    addProgress: string;
    periodPlaceholder: string;
    completionPctLabel: string;
    notesPlaceholder: string;
    noGoalsYet: string;
    parentGoalLabel: string;
    noParentGoal: string;
    linkedToLabel: string;
    actionStepStatus: { not_started: string; in_progress: string; completed: string; stuck: string };
    actionStepFilterAll: string;
    actionStepFilterAttention: string;
    actionStepFilterOpen: string;
    noActionStepsYet: string;
    addActionStep: string;
    relatedWeaknessPlaceholder: string;
    solutionPlanPlaceholder: string;
    implementationStepsPlaceholder: string;
    ownerPlaceholder: string;
    linkedGoalLabel: string;
    noLinkedGoal: string;
    progressNoteLabel: string;
    progressNotePlaceholder: string;
    helpNeededLabel: string;
    helpNeededPlaceholder: string;
    saveProgressButton: string;
    overdueBadge: string;
  };
  admin: {
    nav: { users: string; organizations: string; cycles: string; overview: string; settings: string };
    users: {
      title: string;
      description: string;
      colName: string;
      colRole: string;
      colManager: string;
      colOrg: string;
      noManager: string;
      noOrg: string;
      selfLocked: string;
      empty: string;
      searchPlaceholder: string;
      allRoles: string;
      searchButton: string;
      disableButton: string;
      enableButton: string;
      disabledBadge: string;
      inviteTitle: string;
      inviteDescription: string;
      inviteEmailPlaceholder: string;
      inviteNamePlaceholder: string;
      inviteButton: string;
      pendingInvitationsTitle: string;
      noPendingInvitations: string;
      revokeButton: string;
      invitedAs: string;
    };
    organizations: {
      title: string;
      description: string;
      colName: string;
      colType: string;
      colParent: string;
      noParent: string;
      namePlaceholder: string;
      typeGroup: string;
      typeSubsidiary: string;
      typeDepartment: string;
      empty: string;
      addTitle: string;
    };
    cycles: {
      title: string;
      description: string;
      colName: string;
      colDates: string;
      colCadence: string;
      colStatus: string;
      namePlaceholder: string;
      startLabel: string;
      endLabel: string;
      cadenceQuarterly: string;
      cadenceMonthly: string;
      statusDraft: string;
      statusActive: string;
      statusClosed: string;
      empty: string;
      addTitle: string;
    };
    overview: {
      title: string;
      description: string;
      colName: string;
      colRole: string;
      colOrg: string;
      colStatus: string;
      colUpdated: string;
      noDocument: string;
      viewAction: string;
      empty: string;
      noCycle: string;
      statusDraft: string;
      statusSubmitted: string;
      statusInReview: string;
      statusNeedsRevision: string;
      statusApproved: string;
      statGoals: string;
      statNotStarted: string;
      statInProgress: string;
      statAtRisk: string;
      statCompleted: string;
      statOverdueActions: string;
      needsAttentionTitle: string;
      needsAttentionEmpty: string;
      attentionAtRisk: string;
      attentionOverdue: string;
      viewShort: string;
      byOrgTitle: string;
      colOrgName: string;
      colGoalCount: string;
      colOverdue: string;
      colAvgStatus: string;
      submissionStatusTitle: string;
      detailTableTitle: string;
    };
    documentDetail: {
      title: string;
      owner: string;
      cycle: string;
      status: string;
      content: string;
      reviewHistory: string;
      noReviews: string;
      addReview: string;
      commentPlaceholder: string;
      back: string;
    };
    settings: {
      title: string;
      description: string;
      colField: string;
      requirementHidden: string;
    };
  };
  review: {
    navLabel: string;
    listTitle: string;
    listDescription: string;
    colName: string;
    colRole: string;
    colStatus: string;
    colUpdated: string;
    viewAction: string;
    noDocument: string;
    empty: string;
    noPermission: string;
    backToList: string;
  };
}

const dictionary: Record<Locale, DictShape> = {
  zh: {
    common: {
      appName: "Sunzen 集团沙盘系统",
      headerBrand: "沙盘",
      headerTagline: "2027 规划与追踪",
      save: "保存",
      cancel: "取消",
      signOut: "退出登录",
      create: "新建",
      edit: "编辑",
      close: "关闭",
      noPermission: "无权限访问：此页面仅限管理员使用。",
    },
    login: {
      signInSubtitle: "登录以填写或查看沙盘",
      signUpSubtitle: "创建账号",
      forgotSubtitle: "输入邮箱，获取重设密码链接",
      namePlaceholder: "姓名",
      emailPlaceholder: "邮箱",
      passwordPlaceholder: "密码",
      newPasswordPlaceholder: "新密码",
      signIn: "登录",
      signUp: "注册",
      processing: "处理中...",
      toggleToSignUp: "还没有账号？注册",
      toggleToSignIn: "已有账号？登录",
      forgotPasswordLink: "忘记密码？",
      backToSignIn: "返回登录",
      signUpNotice: "注册成功，请查收邮箱完成验证后再登录。",
      sendResetLink: "发送重设链接",
      resetLinkSentNotice: "重设链接已发送，请查收邮箱（含垃圾邮件夹）。",
      resetPasswordTitle: "设置新密码",
      resetPasswordSubtitle: "请输入你的新密码",
      resetPasswordButton: "更新密码",
      resetPasswordSuccessNotice: "密码已更新，正在跳转到我的沙盘…",
      resetLinkInvalid: "该链接已失效或已过期，请重新申请重设密码。",
    },
    mySandbox: {
      title: "我的沙盘",
      noActiveCycle: "尚未配置进行中的沙盘周期，请联系 HR 建立年度周期。",
      footerNote:
        "填写内容自动按字段保存；只读模块会显示继承自上级的内容。跨部门审核与仪表板对比见 HR 后台。",
      adminLink: "HR 角色分配",
      statusLabel: "当前沙盘状态",
      cadenceLabel: "更新周期",
      requiredCountLabel: "共 {count} 项必填",
      quarterly: "季度",
      monthly: "月度",
      submitButton: "提交沙盘",
      submitIncompleteHint: "完成所有必填项后才能提交",
      submittedNotice: "已提交，等待上级审核",
    },
    sandboxForm: {
      save: "保存",
      inheritedFrom: "继承自：{name}",
      notFilledByManager: "上级尚未填写",
      uploadLabel: "上传附件",
      existingFiles: "已上传文件",
      noFilesYet: "还没有上传文件",
      removeFile: "移除",
      notFilled: "未填写",
      lockedNote: "已提交，暂时无法修改",
      addBlankRowsHint: "填写你需要的几行，其余留空即可",
      goalGroupTitle: {
        annual_business: "年度业务目标",
        annual_team: "年度团队目标",
        annual_personal: "年度个人目标",
        annual_work: "工作目标",
      },
      addGoal: "新增目标",
      titlePlaceholder: "目标标题",
      descriptionPlaceholder: "目标说明（可选）",
      targetValuePlaceholder: "目标值（可选）",
      goalPlanningLabel: "目标规划",
      goalPlanningPlaceholder: "目标规划（可选）",
      implementationStepLabel: "实施步骤",
      implementationStepPlaceholder: "实施步骤（可选）",
      startDate: "开始日期",
      endDate: "结束日期",
      statusLabel: "状态",
      goalStatus: {
        not_started: "未开始",
        in_progress: "进行中",
        at_risk: "有风险",
        completed: "已完成",
      },
      progressHistory: "进度记录",
      noProgressYet: "还没有进度记录",
      addProgress: "记录本期进度",
      periodPlaceholder: "周期，如 2027-Q1 或 2027-01",
      completionPctLabel: "完成度 %",
      notesPlaceholder: "备注（可选）",
      noGoalsYet: "还没有目标，先新增一个",
      parentGoalLabel: "上级目标",
      noParentGoal: "（无上级目标）",
      linkedToLabel: "关联至",
      actionStepStatus: {
        not_started: "未开始",
        in_progress: "进行中",
        completed: "已完成",
        stuck: "卡住",
      },
      actionStepFilterAll: "全部",
      actionStepFilterAttention: "卡住或逾期",
      actionStepFilterOpen: "未完成",
      noActionStepsYet: "还没有行动项，先新增一个",
      addActionStep: "新增行动项",
      relatedWeaknessPlaceholder: "对应弱点/威胁",
      solutionPlanPlaceholder: "解决计划",
      implementationStepsPlaceholder: "实施步骤",
      ownerPlaceholder: "负责人",
      linkedGoalLabel: "关联目标",
      noLinkedGoal: "（不关联目标）",
      progressNoteLabel: "本期进展",
      progressNotePlaceholder: "本期进展（可选）",
      helpNeededLabel: "需要什么帮助",
      helpNeededPlaceholder: "需要什么帮助（可选）",
      saveProgressButton: "保存进展",
      overdueBadge: "逾期",
    },
    admin: {
      nav: { users: "角色分配", organizations: "组织管理", cycles: "沙盘周期", overview: "进度总览", settings: "字段规则设置" },
      users: {
        title: "HR 角色分配",
        description:
          '设置每个人的角色、直属主管与所属组织，决定他们要填的沙盘模块，以及"本人 → 直属主管 → 逐级向上汇总"的可见范围。',
        colName: "姓名 / 邮箱",
        colRole: "角色",
        colManager: "直属主管",
        colOrg: "所属组织",
        noManager: "（无直属主管）",
        noOrg: "（未分配组织）",
        selfLocked: "不能在这里修改自己的角色，避免误操作把自己锁在管理页外",
        empty: "还没有人注册。",
        searchPlaceholder: "按姓名或邮箱搜索",
        allRoles: "全部角色",
        searchButton: "搜索",
        disableButton: "停用",
        enableButton: "启用",
        disabledBadge: "已停用",
        inviteTitle: "邀请新成员",
        inviteDescription:
          "预先设定姓名、角色、直属主管与组织；对方用同一邮箱注册后会自动套用这些设定。",
        inviteEmailPlaceholder: "邮箱",
        inviteNamePlaceholder: "姓名",
        inviteButton: "发出邀请",
        pendingInvitationsTitle: "待激活邀请",
        noPendingInvitations: "没有待激活的邀请。",
        revokeButton: "撤销",
        invitedAs: "邀请为",
      },
      organizations: {
        title: "组织 / 子公司管理",
        description: "维护集团、子公司、部门的层级结构，用于给员工分配所属组织。",
        colName: "名称",
        colType: "类型",
        colParent: "上级组织",
        noParent: "（无上级，顶层组织）",
        namePlaceholder: "组织名称",
        typeGroup: "集团",
        typeSubsidiary: "子公司",
        typeDepartment: "部门",
        empty: "还没有任何组织，先新建一个。",
        addTitle: "新建组织",
      },
      cycles: {
        title: "沙盘周期管理",
        description: "维护年度沙盘周期（如「2027年度沙盘」），控制填写窗口与进度更新节奏。",
        colName: "周期名称",
        colDates: "起止日期",
        colCadence: "更新周期",
        colStatus: "状态",
        namePlaceholder: "如：2027年度沙盘",
        startLabel: "开始日期",
        endLabel: "结束日期",
        cadenceQuarterly: "季度",
        cadenceMonthly: "月度",
        statusDraft: "草拟中",
        statusActive: "进行中",
        statusClosed: "已结束",
        empty: "还没有沙盘周期，先新建一个。",
        addTitle: "新建周期",
      },
      overview: {
        title: "员工填写进度总览",
        description: "查看当前进行中周期里，每个人的沙盘提交与审核状态。",
        colName: "姓名",
        colRole: "角色",
        colOrg: "组织",
        colStatus: "状态",
        colUpdated: "更新时间",
        noDocument: "尚未创建",
        viewAction: "查看 / 审核",
        empty: "还没有人的沙盘记录。",
        noCycle: "尚未配置进行中的沙盘周期。",
        statusDraft: "草稿",
        statusSubmitted: "已提交",
        statusInReview: "审核中",
        statusNeedsRevision: "需修改",
        statusApproved: "已通过",
        statGoals: "目标",
        statNotStarted: "未开始",
        statInProgress: "进行中",
        statAtRisk: "有风险",
        statCompleted: "已完成",
        statOverdueActions: "逾期行动项",
        needsAttentionTitle: "需要关注",
        needsAttentionEmpty: "目前没有风险目标或逾期行动项。",
        attentionAtRisk: "有风险目标",
        attentionOverdue: "行动项已逾期",
        viewShort: "查看",
        byOrgTitle: "按组织看",
        colOrgName: "组织",
        colGoalCount: "目标数",
        colOverdue: "逾期",
        colAvgStatus: "已完成比例",
        submissionStatusTitle: "沙盘提交情况",
        detailTableTitle: "逐人明细",
      },
      documentDetail: {
        title: "沙盘审核",
        owner: "负责人",
        cycle: "周期",
        status: "当前状态",
        content: "沙盘内容",
        reviewHistory: "审核记录",
        noReviews: "还没有审核记录。",
        addReview: "添加审核意见",
        commentPlaceholder: "审核意见（可选）",
        back: "返回总览",
      },
      settings: {
        title: "字段规则设置",
        description: "为每个角色设置各字段是必填、选填、只读展示，还是不显示。修改会立即应用到对应角色的沙盘页面。",
        colField: "字段",
        requirementHidden: "不显示",
      },
    },
    review: {
      navLabel: "审核下属沙盘",
      listTitle: "审核下属沙盘",
      listDescription: "查看并审核你的直属下属的沙盘提交状态。",
      colName: "姓名",
      colRole: "角色",
      colStatus: "状态",
      colUpdated: "更新时间",
      viewAction: "查看 / 审核",
      noDocument: "尚未创建",
      empty: "你没有直属下属。",
      noPermission: "此页面仅限有下属的角色使用。",
      backToList: "返回审核列表",
    },
  },
  en: {
    common: {
      appName: "Sunzen Group Sandbox System",
      headerBrand: "Sandbox",
      headerTagline: "2027 Planning & Tracking",
      save: "Save",
      cancel: "Cancel",
      signOut: "Sign out",
      create: "Create",
      edit: "Edit",
      close: "Close",
      noPermission: "Access denied: this page is for admins only.",
    },
    login: {
      signInSubtitle: "Sign in to fill out or view your sandbox",
      signUpSubtitle: "Create an account",
      forgotSubtitle: "Enter your email to get a password reset link",
      namePlaceholder: "Full name",
      emailPlaceholder: "Email",
      passwordPlaceholder: "Password",
      newPasswordPlaceholder: "New password",
      signIn: "Sign in",
      signUp: "Sign up",
      processing: "Processing...",
      toggleToSignUp: "No account yet? Sign up",
      toggleToSignIn: "Already have an account? Sign in",
      forgotPasswordLink: "Forgot password?",
      backToSignIn: "Back to sign in",
      signUpNotice: "Account created. Please check your email to verify, then sign in.",
      sendResetLink: "Send reset link",
      resetLinkSentNotice: "Reset link sent — check your email (including spam).",
      resetPasswordTitle: "Set a new password",
      resetPasswordSubtitle: "Enter your new password",
      resetPasswordButton: "Update password",
      resetPasswordSuccessNotice: "Password updated — redirecting to My Sandbox…",
      resetLinkInvalid: "This link is invalid or expired. Please request a new one.",
    },
    mySandbox: {
      title: "My Sandbox",
      noActiveCycle: "No active sandbox cycle yet — ask HR to set one up.",
      footerNote:
        "Your entries save automatically per field. View-only modules show what your manager has filled in. Cross-team review and dashboards live in the HR admin section.",
      adminLink: "HR Role Assignment",
      statusLabel: "Sandbox status",
      cadenceLabel: "Update cadence",
      requiredCountLabel: "{count} required item(s)",
      quarterly: "Quarterly",
      monthly: "Monthly",
      submitButton: "Submit sandbox",
      submitIncompleteHint: "Complete all required items before submitting",
      submittedNotice: "Submitted — waiting on your manager's review",
    },
    sandboxForm: {
      save: "Save",
      inheritedFrom: "Inherited from: {name}",
      notFilledByManager: "Not filled in by your manager yet",
      uploadLabel: "Upload attachment",
      existingFiles: "Uploaded files",
      noFilesYet: "No files uploaded yet",
      removeFile: "Remove",
      notFilled: "Not filled in",
      lockedNote: "Submitted — locked until reviewed",
      addBlankRowsHint: "Fill in as many rows as you need — leave the rest blank",
      goalGroupTitle: {
        annual_business: "Annual Business Goals",
        annual_team: "Annual Team Goals",
        annual_personal: "Annual Personal Goals",
        annual_work: "Work Goals",
      },
      addGoal: "Add a goal",
      titlePlaceholder: "Goal title",
      descriptionPlaceholder: "Description (optional)",
      targetValuePlaceholder: "Target value (optional)",
      goalPlanningLabel: "Goal Planning",
      goalPlanningPlaceholder: "Goal planning (optional)",
      implementationStepLabel: "Implementation Step",
      implementationStepPlaceholder: "Implementation step (optional)",
      startDate: "Start date",
      endDate: "End date",
      statusLabel: "Status",
      goalStatus: {
        not_started: "Not started",
        in_progress: "In progress",
        at_risk: "At risk",
        completed: "Completed",
      },
      progressHistory: "Progress history",
      noProgressYet: "No progress logged yet",
      addProgress: "Log progress for this period",
      periodPlaceholder: "Period, e.g. 2027-Q1 or 2027-01",
      completionPctLabel: "Completion %",
      notesPlaceholder: "Notes (optional)",
      noGoalsYet: "No goals yet — add one below",
      parentGoalLabel: "Parent Goal",
      noParentGoal: "(No parent goal)",
      linkedToLabel: "Linked to",
      actionStepStatus: {
        not_started: "Not started",
        in_progress: "In progress",
        completed: "Completed",
        stuck: "Stuck",
      },
      actionStepFilterAll: "All",
      actionStepFilterAttention: "Stuck or overdue",
      actionStepFilterOpen: "Open",
      noActionStepsYet: "No action items yet — add one below",
      addActionStep: "Add an action item",
      relatedWeaknessPlaceholder: "Related weakness/threat",
      solutionPlanPlaceholder: "Solution plan",
      implementationStepsPlaceholder: "Implementation steps",
      ownerPlaceholder: "Owner",
      linkedGoalLabel: "Linked Goal",
      noLinkedGoal: "(Not linked to a goal)",
      progressNoteLabel: "This period's progress",
      progressNotePlaceholder: "This period's progress (optional)",
      helpNeededLabel: "Help needed",
      helpNeededPlaceholder: "What help is needed (optional)",
      saveProgressButton: "Save progress",
      overdueBadge: "Overdue",
    },
    admin: {
      nav: { users: "Roles", organizations: "Organizations", cycles: "Cycles", overview: "Overview", settings: "Field Rules" },
      users: {
        title: "HR Role Assignment",
        description:
          "Set each person's role, direct manager, and organization — this drives which sandbox modules they must fill in, and the \"self → manager → up the chain\" visibility.",
        colName: "Name / Email",
        colRole: "Role",
        colManager: "Manager",
        colOrg: "Organization",
        noManager: "(No manager)",
        noOrg: "(Unassigned)",
        selfLocked: "You can't change your own role here — this prevents accidentally locking yourself out",
        empty: "No one has registered yet.",
        searchPlaceholder: "Search by name or email",
        allRoles: "All roles",
        searchButton: "Search",
        disableButton: "Disable",
        enableButton: "Enable",
        disabledBadge: "Disabled",
        inviteTitle: "Invite a new member",
        inviteDescription:
          "Pre-set their name, role, manager, and organization — it applies automatically the first time they sign up with the same email.",
        inviteEmailPlaceholder: "Email",
        inviteNamePlaceholder: "Full name",
        inviteButton: "Send invite",
        pendingInvitationsTitle: "Pending invitations",
        noPendingInvitations: "No pending invitations.",
        revokeButton: "Revoke",
        invitedAs: "Invited as",
      },
      organizations: {
        title: "Organizations",
        description: "Maintain the group / subsidiary / department hierarchy used to assign people to an organization.",
        colName: "Name",
        colType: "Type",
        colParent: "Parent organization",
        noParent: "(No parent — top level)",
        namePlaceholder: "Organization name",
        typeGroup: "Group",
        typeSubsidiary: "Subsidiary",
        typeDepartment: "Department",
        empty: "No organizations yet — create one below.",
        addTitle: "New organization",
      },
      cycles: {
        title: "Sandbox Cycles",
        description: "Maintain the annual sandbox cycles (e.g. \"2027 Sandbox\") that control the filing window and update cadence.",
        colName: "Cycle name",
        colDates: "Dates",
        colCadence: "Cadence",
        colStatus: "Status",
        namePlaceholder: "e.g. 2027 Sandbox",
        startLabel: "Start date",
        endLabel: "End date",
        cadenceQuarterly: "Quarterly",
        cadenceMonthly: "Monthly",
        statusDraft: "Draft",
        statusActive: "Active",
        statusClosed: "Closed",
        empty: "No cycles yet — create one below.",
        addTitle: "New cycle",
      },
      overview: {
        title: "Submission Progress Overview",
        description: "See everyone's sandbox submission and review status for the active cycle.",
        colName: "Name",
        colRole: "Role",
        colOrg: "Organization",
        colStatus: "Status",
        colUpdated: "Updated",
        noDocument: "Not started",
        viewAction: "View / Review",
        empty: "No sandbox records yet.",
        noCycle: "No active sandbox cycle configured.",
        statusDraft: "Draft",
        statusSubmitted: "Submitted",
        statusInReview: "In review",
        statusNeedsRevision: "Needs revision",
        statusApproved: "Approved",
        statGoals: "Goals",
        statNotStarted: "Not started",
        statInProgress: "In progress",
        statAtRisk: "At risk",
        statCompleted: "Completed",
        statOverdueActions: "Overdue action items",
        needsAttentionTitle: "Needs attention",
        needsAttentionEmpty: "No at-risk goals or overdue action items right now.",
        attentionAtRisk: "At-risk goal",
        attentionOverdue: "Action item overdue",
        viewShort: "View",
        byOrgTitle: "By organization",
        colOrgName: "Organization",
        colGoalCount: "Goals",
        colOverdue: "Overdue",
        colAvgStatus: "Completion rate",
        submissionStatusTitle: "Sandbox submission status",
        detailTableTitle: "Per-person detail",
      },
      documentDetail: {
        title: "Sandbox Review",
        owner: "Owner",
        cycle: "Cycle",
        status: "Current status",
        content: "Sandbox content",
        reviewHistory: "Review history",
        noReviews: "No reviews yet.",
        addReview: "Add a review",
        commentPlaceholder: "Comments (optional)",
        back: "Back to overview",
      },
      settings: {
        title: "Field Rules",
        description: "Set whether each field is required, optional, view-only, or hidden for each role. Changes apply immediately to that role's sandbox page.",
        colField: "Field",
        requirementHidden: "Hidden",
      },
    },
    review: {
      navLabel: "Review My Team",
      listTitle: "Review My Team",
      listDescription: "See and review your direct reports' sandbox submission status.",
      colName: "Name",
      colRole: "Role",
      colStatus: "Status",
      colUpdated: "Updated",
      viewAction: "View / Review",
      noDocument: "Not started",
      empty: "You have no direct reports.",
      noPermission: "This page is only for roles with direct reports.",
      backToList: "Back to review list",
    },
  },
};

export function getDict(locale: Locale): DictShape {
  return dictionary[locale];
}
