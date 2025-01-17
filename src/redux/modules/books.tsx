import { Action, createActions, handleActions } from 'redux-actions';
import { call, put, select, takeLatest } from 'redux-saga/effects';
import { BookReqType, BooksState, BookType } from '../../types';
import BookService from '../../service/bookService';
import { useHistory as UseHistory } from 'react-router';

const initialState: BooksState = {
  books: null,
  loading: false,
  error: null,
};
const prefix = 'my-books/books';

export const { pending, success, fail } = createActions(
  'PENDING',
  'SUCCESS',
  'FAIL',
  {
    prefix,
  }
);

const reducer = handleActions<BooksState, BookType[]>(
  {
    PENDING: (state) => ({ ...state, loading: true, error: null }),
    SUCCESS: (state, action) => ({
      books: action.payload,
      loading: false,
      error: null,
    }),
    FAIL: (state, action: any) => ({
      ...state,
      loading: false,
      error: action.payload,
    }),
  },
  initialState,
  { prefix }
);

export default reducer;

//saga

export const { getBooks, addBook, deleteBook, editBook } = createActions(
  'GET_BOOKS',
  'ADD_BOOK',
  'DELETE_BOOK',
  'EDIT_BOOK',
  {
    prefix,
  }
);

function* getBooksSaga() {
  try {
    yield put(pending());
    const token: string = yield select((state) => state.auth.token);
    const books: BookType[] = yield call(BookService.getBooks, token);
    yield put(success(books));
  } catch (error: any) {
    yield put(fail(new Error(error.response?.data?.error || 'UNKNOWN_ERROR')));
  }
}
function* addBookSaga(action: Action<BookReqType>) {
  const History = UseHistory();
  try {
    yield put(pending());
    const token: string = yield select((state) => state.auth.token);
    const book: BookType = yield call(
      BookService.addBook,
      token,
      action.payload
    );
    const books: BookType[] = yield select((state) => state.books.books);
    yield put(success([...books, book]));
    History.push('/');
  } catch (error: any) {
    yield put(fail(new Error(error.response?.data?.error || 'UNKNOWN_ERROR')));
  }
}
function* deleteBookSaga(action: Action<number>) {
  try {
    const bookId = action.payload;
    const token: string = yield select((state) => state.auth.token);
    const books: BookType[] = yield select((state) => state.books.books);
    yield put(pending());
    yield call(BookService.deleteBook, token, bookId);
    yield put(success(books.filter((book) => book.bookId !== bookId)));
  } catch (error: any) {
    yield put(fail(new Error(error.response?.data?.error || 'UNKNOWN_ERROR')));
  }
}

function* editBooksSaga(action: Action<BookReqType>) {
  try {
    yield put(pending());
    const books: BookType[] = yield select((state) => state.books.books);
    const token: string = yield select((state) => state.auth.token);
    yield call(BookService.editBook, token, action.payload);
    yield put(success(books));
  } catch (error: any) {
    yield put(fail(new Error(error.response?.data?.error || 'UNKNOWN_ERROR')));
  }
}

export function* booksSaga() {
  yield takeLatest(`${prefix}/GET_BOOKS`, getBooksSaga);
  yield takeLatest(`${prefix}/ADD_BOOK`, addBookSaga);
  yield takeLatest(`${prefix}/DELETE_BOOK`, deleteBookSaga);
  yield takeLatest(`${prefix}/EDIT_BOOK`, editBooksSaga);
}
