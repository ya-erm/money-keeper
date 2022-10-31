import { addMessages } from 'svelte-i18n';
import type { Dictionary } from './messages';

export const ruDict: Dictionary = {
  // Common
  'common.back': 'Назад',
  'common.select': 'Выбрать',
  'common.available_variants': 'Доступные варианты',
  'common.optional': 'опционально',
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
  'common.save_changes_failure': 'Не удалось сохранить изменения',
  'common.save_changes_success': 'Изменения сохранены',
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
  'accounts.create_account': 'Создать счёт',
  'accounts.create_account_failure': 'Не удалось создать счёт',
  'accounts.create_account_success': 'Счёт создан',
  'accounts.edit_account': 'Редактировать счёт',
  'accounts.delete_account': 'Удалить счёт',
  'accounts.delete_account_failure': 'Не удалось удалить счёт',
  'accounts.delete_account_success': 'Счёт удален',
  'accounts.name': 'Название',
  'accounts.currency': 'Валюта',
  'accounts.icon': 'Значок',
  'accounts.color': 'Цвет',
  // Categories
  'categories.title': 'Категории',
  'categories.create_category': 'Создать категорию',
  'categories.create_category_success': 'Категория создана',
  'categories.create_category_failure': 'Не удалось создать категорию',
  'categories.edit_category': 'Редактировать категорию',
  'categories.delete_category': 'Удалить категорию',
  'categories.delete_category_failure': 'Не удалось удалить категорию',
  'categories.delete_category_success': 'Категория удалена',
  'categories.name': 'Название',
  'categories.icon': 'Значок',
  // Groups
  'groups.title': 'Группы',
  'groups.create_group': 'Создать группу',
  'groups.name': 'Название',
  'groups.edit_group': 'Редактировать группу',
  'groups.edit_group_name': 'Изменить название группы',
  'groups.users': 'Пользователи',
  'groups.add_user': 'Добавить пользователя',
  'groups.failed_to_add_user': 'Не удалось добавить пользователя',
  'groups.username': 'Имя пользователя',
  'groups.delete_group': 'Удалить группу',
  // Transactions
  'transactions.title': 'Операции',
  'transactions.create_transaction': 'Создать операцию',
  'transactions.new_transaction': 'Новая операция',
  'transactions.account': 'Счёт',
  'transactions.account_is_required': 'Сначала выберите счёт',
  'transactions.date': 'Дата',
  'transactions.amount': 'Сумма',
  'transactions.category': 'Категория',
  'transactions.category_is_required': 'Сначала выберите категорию',
  'transactions.comment': 'Комментарий',
  'transactions.edit_transaction': 'Редактировать операцию',
  'transactions.delete_transaction': 'Удалить операцию',
  // Settings
  'settings.title': 'Настройки',
  'settings.language': 'Язык',
  'settings.select_language': 'Выберите язык',
  'settings.common': 'Общее',
  'settings.darkMode': 'Тёмная тема',
};

addMessages('ru-RU', ruDict);
