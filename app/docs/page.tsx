'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';
import Link from 'next/link';

export default function DocsPage() {
  const { theme } = useTheme();
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Что такое проект' },
    { id: 'testing', label: 'API Тестер' },
    { id: 'collections', label: 'Коллекции' },
    { id: 'generation', label: 'Генерация документации' },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className={`sticky top-8 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-xl p-4 shadow-lg`}>
              <h2 className="text-lg font-bold mb-4">Содержание</h2>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : theme === 'dark'
                        ? 'text-slate-300 hover:bg-slate-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </nav>
              <div className="mt-6 pt-6 border-t border-slate-700">
                <Link
                  href="/"
                  className={`text-sm ${
                    theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ← На главную
                </Link>
              </div>
            </div>
          </aside>

          <main className="flex-1 max-w-3xl h-[calc(100vh-4rem)] overflow-y-auto pr-4">
            {activeSection === 'overview' && (
              <section>
                <h1 className="text-4xl font-bold mb-6">Что такое проект?</h1>

                <div className={`p-6 rounded-xl mb-8 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h2 className="text-2xl font-bold mb-4">Проект в API Saurus</h2>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Проект — это основная единица работы в API Saurus. Каждый проект представляет собой отдельную API спецификацию,
                    описанную в формате OpenAPI 3.0.
                  </p>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    В проект входит:
                  </p>
                  <ul className="space-y-2 mb-4">
                    {[
                      'Название и описание проекта',
                      'OpenAPI 3.0 спецификация вашего API',
                      'История изменений спецификации',
                      'Связанные коллекции запросов для тестирования',
                    ].map((item, idx) => (
                      <li key={idx} className={`flex items-start gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-blue-400">•</span> {item}
                      </li>
                    ))}
                  </ul>
                  <p className={`${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Проекты позволяют организовать работу с разными API, сохраняя все спецификации и тесты в одном месте.
                    Вы можете создавать неограниченное количество проектов для разных API.
                  </p>
                </div>
              </section>
            )}

            {activeSection === 'testing' && (
              <section>
                <h1 className="text-4xl font-bold mb-8">Как пользоваться API Тестером</h1>

                <div className={`p-6 rounded-xl mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h2 className="text-2xl font-bold mb-4">API Тестер</h2>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    API Тестер — это встроенный HTTP клиент для тестирования API эндпоинтов. Он позволяет отправлять запросы
                    и просматривать ответы прямо в браузере.
                  </p>

                  <h3 className="text-lg font-semibold mb-3">Как отправить запрос</h3>
                  <ol className="space-y-3 mb-6">
                    {[
                      'Выберите HTTP метод (GET, POST, PUT, DELETE и др.)',
                      'Введите URL эндпоинта в поле ввода',
                      'При необходимости добавьте заголовки (Headers)',
                      'Для POST/PUT запросов добавьте тело (Body)',
                      'Нажмите кнопку «Отправить» (Send)',
                    ].map((item, idx) => (
                      <li key={idx} className={`flex gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {idx + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>

                  <h3 className="text-lg font-semibold mb-3">Поддерживаемые методы</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].map((method) => (
                      <span key={method} className={`px-3 py-1 rounded text-sm font-mono font-bold ${
                        method === 'GET' ? 'bg-green-600' :
                        method === 'POST' ? 'bg-blue-600' :
                        method === 'PUT' ? 'bg-yellow-600' :
                        method === 'DELETE' ? 'bg-red-600' :
                        'bg-slate-600'
                      } text-white`}>
                        {method}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-lg font-semibold mb-3">Типы тела запроса</h3>
                  <p className={`mb-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Для методов POST, PUT, PATCH можно выбрать тип тела запроса:
                  </p>
                  <ul className="space-y-2">
                    {[
                      'JSON - для REST API',
                      'Form Data - для загрузки файлов',
                      'x-www-form-urlencoded - для HTML форм',
                      'XML - для SOAP сервисов',
                      'Plain Text - произвольный текст',
                    ].map((item, idx) => (
                      <li key={idx} className={`flex items-start gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-blue-400">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h2 className="text-2xl font-bold mb-4">Просмотр ответа</h2>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    После отправки запроса вы увидите:
                  </p>
                  <ul className="space-y-2">
                    {[
                      'Статус-код ответа (200, 404, 500 и т.д.)',
                      'Время выполнения запроса',
                      'Тело ответа с подсветкой синтаксиса',
                      'Заголовки ответа',
                    ].map((item, idx) => (
                      <li key={idx} className={`flex items-start gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-blue-400">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {activeSection === 'collections' && (
              <section>
                <h1 className="text-4xl font-bold mb-8">Что такое коллекции?</h1>

                <div className={`p-6 rounded-xl mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h2 className="text-2xl font-bold mb-4">Коллекции запросов</h2>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Коллекции — это группы связанных HTTP запросов, которые можно сохранять и повторно использовать.
                    Это похоже на Postman Collections или Insomnia Collections.
                  </p>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Коллекции позволяют организовать запросы к вашему API по группам и быстро получать к ним доступ.
                  </p>
                </div>

                <div className={`p-6 rounded-xl mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h2 className="text-2xl font-bold mb-4">Как создать коллекцию</h2>
                  <ol className="space-y-3">
                    {[
                      'Перейдите в раздел «Коллекции» в боковой панели',
                      'Нажмите кнопку «Новая коллекция»',
                      'Введите название и описание коллекции',
                      'Начните добавлять запросы в коллекцию',
                    ].map((item, idx) => (
                      <li key={idx} className={`flex gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {idx + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h2 className="text-2xl font-bold mb-4">Возможности коллекций</h2>
                  <ul className="space-y-2">
                    {[
                      'Сохранение запросов с полными настройками (headers, params, body)',
                      'Быстрое повторение сохраненных запросов',
                      'Организация запросов по группам внутри коллекции',
                      'Импорт и экспорт коллекций для обмена с командой',
                    ].map((item, idx) => (
                      <li key={idx} className={`flex items-start gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-blue-400">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {activeSection === 'generation' && (
              <section>
                <h1 className="text-4xl font-bold mb-8">Генерация документации API</h1>

                <div className={`p-6 rounded-xl mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h2 className="text-2xl font-bold mb-4">Автоматическая генерация документации</h2>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    API Saurus автоматически генерирует красивую и понятную документацию на основе вашей OpenAPI 3.0 спецификации.
                    Вам не нужно писать документацию вручную — она создается из описания вашего API.
                  </p>
                </div>

                <div className={`p-6 rounded-xl mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h2 className="text-2xl font-bold mb-4">Как это работает</h2>
                  <ol className="space-y-3">
                    {[
                      'Создайте или откройте проект с OpenAPI спецификацией',
                      'Убедитесь, что спецификация заполнена корректно (endpoints, параметры, ответы)',
                      'Перейдите в режим просмотра документации',
                      'Документация будет сгенерирована автоматически на основе спецификации',
                    ].map((item, idx) => (
                      <li key={idx} className={`flex gap-3 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {idx + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className={`p-6 rounded-xl mb-6 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h2 className="text-2xl font-bold mb-4">Что включает в себя документация</h2>
                  <ul className="space-y-2">
                    {[
                      'Список всех эндпоинтов API с описанием',
                      'Параметры запроса (path, query, header)',
                      'Схемы тела запроса и ответа',
                      'Примеры ответов для разных статус-кодов',
                      'Модели данных (schemas)',
                    ].map((item, idx) => (
                      <li key={idx} className={`flex items-start gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-blue-400">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} shadow-lg`}>
                  <h2 className="text-2xl font-bold mb-4">Редактирование документации</h2>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Чтобы изменить документацию, просто отредактируйте вашу OpenAPI спецификацию:
                  </p>
                  <ul className="space-y-2">
                    {[
                      'Используйте редактор кода (YAML/JSON) для точного описания',
                      'Или используйте визуальный конструктор для создания API без кода',
                      'Документация обновится автоматически при сохранении изменений',
                    ].map((item, idx) => (
                      <li key={idx} className={`flex items-start gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                        <span className="text-blue-400">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
