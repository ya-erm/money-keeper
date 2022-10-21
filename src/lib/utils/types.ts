export type CustomSubmitEvent<T> = SubmitEvent & { currentTarget: EventTarget & T };

export type FromSubmitEvent = CustomSubmitEvent<HTMLFormElement>;

export type FromSubmitDispatcher = {
  submit: FromSubmitEvent;
};
