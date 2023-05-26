import { addMessages } from 'svelte-i18n';
import type { Dictionary } from './messages';

export const ruDict: Dictionary = {
  'app.title': 'Money Keeper',
  // Common
  'common.back': 'Назад',
  'common.select': 'Выбрать',
  'common.accept': 'Принять',
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
  'common.nothing_found': 'Ничего не найдено',
  'common.create': 'Создать',
  'common.save': 'Сохранить',
  'common.add': 'Добавить',
  'common.save_changes_failure': 'Не удалось сохранить изменения',
  'common.save_changes_success': 'Изменения сохранены',
  'common.search': 'Поиск',
  'common.clear': 'Очистить',
  'common.cancel': 'Отмена',
  'common.delete': 'Удалить',
  'common.ok': 'OK',
  'common.continue': 'Продолжить',
  // Tags
  'tags.add_modal_header': 'Добавить тег',
  'tags.edit_modal_header': 'Редактировать тег',
  'tags.title': 'Название',
  'tags.delete_tag': 'Удалить тег',
  'tags.add_tag_failure': 'Не удалось добавить тег',
  'tags.edit_tag_failure': 'Не удалось изменить тег',
  'tags.delete_tag_failure': 'Не удалось удалить тег',
  // Language
  'language.select_language': 'Выберите язык',
  // Auth
  'auth.login.title': 'Вход',
  'auth.login': 'Логин',
  'auth.password': 'Пароль',
  'auth.sign_in': 'Войти',
  'auth.incorrect_login_or_password': 'Неверный логин или пароль',
  'auth.incorrect_old_password': 'Неверный старый пароль',
  'auth.failed_to_login': 'Не удалось войти',
  'auth.register.title': 'Регистрация',
  'auth.name': 'Имя',
  'auth.phone': 'Телефон',
  'auth.old_password': 'Старый пароль',
  'auth.new_password': 'Новый пароль',
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
  'accounts.list': 'Список счетов',
  'accounts.title': 'Счета',
  'accounts.new_account': 'Новый счёт',
  'accounts.create_account': 'Создать счёт',
  'accounts.create_account_failure': 'Не удалось создать счёт',
  'accounts.create_account_success': 'Счёт создан',
  'accounts.edit_account': 'Редактировать счёт',
  'accounts.delete_account': 'Удалить счёт',
  'accounts.delete_account_confirm': 'Вы уверены, что хотите удалить счёт?',
  'accounts.delete_account_confirm_description':
    'Все связанные со счётом операции будут также удалены. Это действие будет невозможно отменить.',
  'accounts.delete_account_failure': 'Не удалось удалить счёт',
  'accounts.delete_account_success': 'Счёт удален',
  'accounts.name': 'Название',
  'accounts.currency': 'Валюта',
  'accounts.icon': 'Значок',
  'accounts.color': 'Цвет',
  'accounts.order': 'Порядковый номер',
  // Categories
  'categories.title': 'Категории',
  'categories.incomings': 'Доходы',
  'categories.outgoings': 'Расходы',
  'categories.new_category': 'Новая категория',
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
  'groups.delete_user_confirm': 'Исключить пользователя из группы?',
  'groups.delete_user_confirm_description':
    'Пользователь потеряет доступ к счетам, категориям и операциям этого рабочего пространства.',
  'groups.delete_user': 'Исключить',
  'groups.failed_to_delete_user': 'Не удалось исключить пользователя из группы',
  'groups.delete_group': 'Удалить группу',
  'groups.delete_group_confirm': 'Вы уверены, что хотите удалить группу?',
  'groups.delete_group_confirm_description':
    'Будут удалены все связанные с этой группой счета, категории и операции. Это действие будет невозможно отменить.',
  'groups.failed_to_delete_group': 'Не удалось удалить группу',
  // Transactions
  'transactions.title': 'Операции',
  'transactions.create_transaction': 'Создать операцию',
  'transactions.new_transaction': 'Новая операция',
  'transactions.incoming': 'Доход',
  'transactions.outgoing': 'Расход',
  'transactions.transfer': 'Перевод',
  'transactions.from': 'Откуда',
  'transactions.to': 'Куда',
  'transactions.account': 'Счёт',
  'transactions.account_is_required': 'Сначала выберите счёт',
  'transactions.destination_account_is_required': 'Сначала выберите счёт назначения',
  'transactions.accounts_must_be_different': 'Выберите разные счета',
  'transactions.date': 'Дата',
  'transactions.time': 'Время',
  'transactions.dateTime': 'Дата и время',
  'transactions.amount': 'Сумма',
  'transactions.category': 'Категория',
  'transactions.category_is_required': 'Сначала выберите категорию',
  'transactions.comment': 'Комментарий',
  'transactions.tags': 'Теги',
  'transactions.edit_transaction': 'Редактировать операцию',
  'transactions.create_transaction_success': 'Операция создана',
  'transactions.create_transaction_failure': 'Не удалось создать операцию',
  'transactions.delete_transaction': 'Удалить операцию',
  'transactions.delete_transaction_success': 'Операция удалена',
  'transactions.delete_transaction_failure': 'Не удалось удалить операцию',
  'transactions.import': 'Импорт',
  'transactions.import.title': 'Импорт операций',
  'transactions.import.invalid_expression': 'Введите поисковый запрос, чтобы выбрать операции одной категории',
  'transactions.import.no_category': 'Без категории',
  'transactions.import.set_category': 'Указать категорию',
  'transactions.import.select_category_title': 'Выберите категорию',
  'transactions.import.select_category_multi_title':
    'Выберите категорию для {count, plural, one {# операции} other {# операций}}',
  'transactions.import.apply': 'Применить категорию',
  'transactions.import.category_applied':
    'Категория "{category}" применена для {count, plural, one {# операции} other {# операций}}',
  'transactions.import.select_category_for_all_operations': 'Выберите категории для всех операций',
  'transactions.import.finish': 'Завершить импорт',
  'transactions.import.finished':
    '{count, plural, one {Импортирована # операция} few {Импортировано # операций} other {Импортировано # операций}}',
  // Import rules
  'transactions.import.rules.title': 'Правила импорта',
  'transactions.import.rules.create': 'Создать правило',
  'transactions.import.rules.edit_rule': 'Редактировать правило',
  'transactions.import.rules.how_does_it_work': 'Как это работает?',
  'transactions.import.rules.how_does_it_work.description':
    'Если описание операции удовлетворит условию поиска, то операции будет назначена выбранная категория и добавлены выбранные теги',
  'transactions.import.rules.condition': 'Условие поиска',
  'transactions.import.rules.category': 'Категория',
  'transactions.import.rules.tags': 'Теги',
  'transactions.import.rules.category_or_tags_required': 'Сначала выберите категорию и/или теги',
  'transactions.import.rules.save_rule_success': 'Правило импорта сохранено',
  'transactions.import.rules.save_rule_failure': 'Не удалось сохранить правило',
  'transactions.import.rules.delete': 'Удалить правило',
  'transactions.import.rules.delete_success': 'Правило удалено',
  'transactions.import.rules.delete_failure': 'Не удалось удалить правило',
  // System
  'system.category.transfer_in': 'Перевод c другого счёта',
  'system.category.transfer_out': 'Перевод на другой счёт',
  // Currency rates
  'currency_rates.title': 'Курсы валют',
  'currency_rates.default_currency': 'Основная валюта',
  'currency_rates.new_currency_rate': 'Новый курс валют',
  'currency_rates.currency1': 'Валюта 1',
  'currency_rates.currency2': 'Валюта 2',
  'currency_rates.rate': 'Курс',
  'currency_rates.delete_currency_rate': 'Удалить курс валют',
  'currency_rates.delete_currency_rate_success': 'Курс валют удалён',
  'currency_rates.delete_currency_rate_failure': 'Не удалось удалить курс валют',
  // Settings
  'settings.title': 'Настройки',
  'settings.language': 'Язык',
  'settings.select_language': 'Выберите язык',
  'settings.common': 'Общее',
  'settings.darkMode': 'Тёмная тема',
  'settings.theme': 'Оформление',
  'settings.theme.light': 'Светлое',
  'settings.theme.dark': 'Тёмное',
  'settings.theme.system': 'Как в системе',
  'settings.import_export': 'Импорт / Экспорт',
  'settings.profile': 'Профиль',
  'settings.profile.change_name': 'Изменить имя',
  'settings.profile.change_name_failure': 'Не удалось изменить имя',
  'settings.profile.change_login': 'Изменить логин',
  'settings.profile.change_login_failure': 'Не удалось изменить логин',
  'settings.profile.change_password': 'Изменить пароль',
  'settings.profile.change_password_success': 'Пароль успешно изменён',
  'settings.profile.change_password_failure': 'Не удалось изменить пароль',
  'settings.profile.change_workspace': 'Выберите пространство',
  'settings.profile.change_workspace_failure': 'Не удалось выбрать рабочее пространство',
  'settings.profile.logout': 'Выйти из системы',
  'settings.collaboration': 'Совместная работа',
  'settings.collaboration.workspace': 'Рабочее пространство',
  'settings.collaboration.workspaces': 'Рабочие пространства',
  'settings.collaboration.invites': 'Приглашения',
  'settings.collaboration.blocklist': 'Чёрный список',
  'settings.encryption': 'Шифрование',
  'settings.report_problem': 'Сообщить о проблеме',
  'settings.version': 'Версия: {version}',
  'settings.uikit': 'UI Kit',
};

addMessages('ru-RU', ruDict);
