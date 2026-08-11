declare const Notiflix: {
  Notify: {
    init(options?: Record<string, unknown>): void;
    failure(message: string): void;
  };
  Confirm: {
    init(options?: Record<string, unknown>): void;
    show(
      title: string,
      message: string,
      okButtonText: string,
      cancelButtonText: string,
      okCallback?: () => void,
      cancelCallback?: () => void,
    ): void;
  };
  Loading: {
    circle(options?: Record<string, unknown>): void;
    remove(): void;
  };
  Report: {
    success(
      title: string,
      message: string,
      buttonText?: string,
      callback?: () => void,
    ): void;
    failure(title: string, message: string, buttonText?: string): void;
  };
};

declare const grecaptcha: {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
};
