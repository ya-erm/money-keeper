import { addMessages } from 'svelte-i18n';
import type { Dictionary } from './messages';

export const ruDict: Dictionary = {
  // Common
  'common.back': 'Назад',
  'common.select': 'Выбрать',
  'common.available_variants': 'Доступные варианты',
  'common.loading': 'Загрузка...',
  'common.show_more': 'Показать ещё',
  'common.sorting': 'Сортировка',
  'common.sort_by': 'Поле для сортировки',
  'common.sort_direction': 'Направление сортировки',
  'common.ascending': 'По возрастанию',
  'common.descending': 'По убыванию',
  'common.grouping': 'Группировка',
  'common.no_items': 'Здесь пока ничего нет',
  'common.create': 'Создать',
  'common.save': 'Сохранить',
  'common.add': 'Добавить',
  'common.failed_to_save_changes': 'Не удалось сохранить изменения',
  // Auth
  'auth.login.title': 'Вход',
  'auth.login': 'Логин',
  'auth.password': 'Пароль',
  'auth.sign_in': 'Войти',
  'auth.incorrect_login_or_password': 'Неверный логин или пароль',
  'auth.failed_to_login': 'Не удалось войти',
  'auth.register.title': 'Регистрация',
  'auth.name': 'Имя',
  'auth.phone': 'Телефон',
  'auth.repeat_password': 'Повторите пароль',
  'auth.passwords_must_be_same': 'Пароли должны совпадать',
  'auth.register': 'Зарегистрироваться',
  'auth.user_already_exists': 'Пользователь уже существует',
  'auth.failed_to_register': 'Не удалось зарегистрироваться',
  'auth.logout.title': 'Выход',
  'auth.sign_out': 'Выйти',
  'auth.profile': 'Профиль',
  'auth.logged_in_as': 'Вы зашли как {name}!',
  'auth.not_logged_in': 'Вы не авторизованы',
  // Accounts
  'accounts.title': 'Счета',
  // Groups
  'groups.title': 'Группы',
  'groups.create_group': 'Создать группу',
  'groups.name': 'Название',
  'groups.edit_group_name': 'Изменить название группы',
  'groups.users': 'Пользователи',
  'groups.add_user': 'Добавить пользователя',
  'groups.failed_to_add_user': 'Не удалось добавить пользователя',
  'groups.username': 'Имя пользователя',
  'groups.delete_group': 'Удалить группу',
  // Settings
  'settings.title': 'Настройки',
  'settings.language': 'Язык',
  'settings.select_language': 'Выберите язык',
  'settings.common': 'Общее',
  'settings.darkMode': 'Тёмная тема',
};

addMessages('ru-RU', ruDict);
